# Endpoint Security and EDR

## Overview — CS0-003 Domain 1

**Endpoint Detection and Response (EDR)** is the primary telemetry source for detecting advanced threats on hosts. Unlike traditional antivirus, EDR records continuous behavioral telemetry — every process, network connection, file operation, and registry change — enabling retroactive investigation and behavioral detection. CySA+ expects you to understand EDR telemetry, Sysmon event IDs, and common attacker patterns.

## EDR vs AV vs XDR

| Capability | Traditional AV | EDR | XDR |
|---|---|---|---|
| **Detection method** | Signature-based | Behavioral + signatures | Behavioral, cross-telemetry correlation |
| **Telemetry depth** | Minimal (scan results) | Process, network, file, registry, memory | EDR + network + email + identity + cloud |
| **Response** | Quarantine file | Isolate host, kill process, rollback | Automated cross-platform response |
| **Retroactive analysis** | No | Yes (search historical data) | Yes |
| **Alert context** | Low | High (process tree, parent-child) | Highest (correlated kill chain) |
| **Examples** | Windows Defender (basic), Symantec | CrowdStrike Falcon, SentinelOne, Carbon Black | Microsoft Defender XDR, Palo Alto Cortex XDR |

**Key distinction for exam:** EDR stores a **process tree** — you can trace an attack from the initial loader all the way through lateral movement. AV only tells you a file was malicious.

## EDR Telemetry Sources

### Process Events
- Process creation: name, path, command line, parent process, user context, hash
- Process injection attempts: cross-process memory writes
- Suspicious parent-child relationships (see detection patterns below)

### Network Events
- Outbound connections: destination IP, port, protocol, associated process
- DNS queries made by each process
- Named pipe connections (lateral movement via SMB)

### File System Events
- File creation, modification, deletion
- Executable dropped to disk (new PE files in temp directories)
- File rename (ransomware encryption pattern)

### Registry Events
- Key creation/modification — persistence via Run keys, services, COM hijacking
- Sensitive key access — SAM, SECURITY hive reads (credential access)

### Memory Events
- LSASS access — credential dumping indicator (see T1003 in MITRE-ATTCK-Reference)
- Shellcode injection into legitimate processes
- Reflective DLL loading (no file on disk)

## Sysmon — Key Event IDs

**System Monitor (Sysmon)** is a free Microsoft Sysinternals tool that extends Windows event logging with high-fidelity process, network, and file data. It writes to the `Microsoft-Windows-Sysmon/Operational` event log.

### Critical Sysmon Event IDs

| Event ID | Name | What to Look For |
|---|---|---|
| **1** | Process Create | Full command line, parent process, image hash — detects LOLBins, encoded PS |
| **3** | Network Connection | Process making outbound connection — C2 detection, beaconing |
| **7** | Image Loaded | DLL loaded into process — detect DLL hijacking, reflective loading |
| **8** | CreateRemoteThread | Thread created in another process — classic process injection indicator |
| **10** | ProcessAccess | Process reading another process's memory — LSASS dumping (Mimikatz) |
| **11** | FileCreate | File creation — executables dropped to disk, ransomware output |
| **13** | Registry Value Set | Registry modification — persistence in Run keys, AppInit DLLs |
| **15** | FileCreateStreamHash | ADS (Alternate Data Stream) creation — file hiding technique |
| **22** | DNS Query | Process DNS query — C2 domain resolution, DNS tunneling |

### Sysmon Configuration Tip

Default Sysmon logs everything — produces enormous volume. Deploy a tuned config (SwiftOnSecurity or Olaf Hartong configs are community standards). Key tuning targets:
- Whitelist known-good software (antivirus, backup agents) for noisy event types
- Enable Event ID 8 (CreateRemoteThread) logging — disabled by default, critical for injection detection
- Log all DNS queries (Event ID 22) — high value, moderate volume

## Common Detection Patterns

### LOLBins (Living Off the Land Binaries)

Attackers use legitimate Windows binaries to execute malicious code, evade AV, and blend into normal activity.

| Binary | Malicious Use | Detection Signal |
|---|---|---|
| `powershell.exe` | Download/execute, encoded commands | `-EncodedCommand`, `IEX`, `DownloadString` in cmdline |
| `certutil.exe` | Download files, decode base64 | `-urlcache`, `-decode` flags |
| `mshta.exe` | Execute HTA files, VBScript | Spawns from Office, email clients |
| `regsvr32.exe` | COM scriptlet execution (Squiblydoo) | `/s /n /u /i:http://` pattern |
| `wscript.exe` / `cscript.exe` | Script execution | Running `.js`, `.vbs` from temp/download dir |
| `rundll32.exe` | Execute DLL exports | Uncommon DLL paths, temp directories |
| `msiexec.exe` | Remote MSI execution | `/q /i http://` pattern |
| `wmic.exe` | Remote execution, lateral movement | `process call create` with remote target |

### Suspicious Parent-Child Process Relationships

| Parent | Child | Why Suspicious |
|---|---|---|
| `winword.exe` | `cmd.exe` / `powershell.exe` | Macro-based malware execution |
| `excel.exe` | `wscript.exe` | Weaponized spreadsheet |
| `outlook.exe` | `powershell.exe` | Phishing attachment execution |
| `explorer.exe` | `powershell.exe -enc` | Encoded command from user context |
| `services.exe` | Unexpected child | Malicious service installation |
| `lsass.exe` | Any child process | Heavily anomalous — LSASS should spawn nothing |

### Token Impersonation and Privilege Escalation

- **Token impersonation** — an attacker impersonates a higher-privileged user's token already present on the system
- Indicators: Windows Event ID 4672 (special privileges assigned), Sysmon EID 10 (OpenProcess on LSASS), processes running as SYSTEM without legitimate origin
- Tools: Incognito, Meterpreter `getsystem`, Cobalt Strike token features

### Credential Dumping Patterns

- **LSASS access** — Sysmon EID 10 with TargetImage = `lsass.exe` from unexpected source processes
- **Volume Shadow Copy deletion** — `vssadmin delete shadows` (ransomware prep), logged via EID 1
- **SAM/SECURITY registry dump** — `reg save HKLM\SAM`, `reg save HKLM\SECURITY` commands in EID 1

```
# Sysmon EID 10 — LSASS Access Example
TargetImage:  C:\Windows\System32\lsass.exe
SourceImage:  C:\Users\user\AppData\Local\Temp\svhost32.exe
GrantedAccess: 0x1010  <- PROCESS_VM_READ | PROCESS_QUERY_LIMITED_INFORMATION
CallTrace:    C:\Windows\SYSTEM32\ntdll.dll+...
```

## Endpoint Hardening Complements EDR

EDR detects; hardening reduces attack surface:

- **Application allowlisting** (Windows Defender Application Control / AppLocker) — only approved executables run; LOLBin abuse still possible but constrained
- **PowerShell constrained language mode** — limits PowerShell to approved commands; breaks many attack scripts
- **Credential Guard** — isolates LSASS in a VSM (Virtual Secure Mode) container; blocks LSASS memory reads by Mimikatz
- **Attack Surface Reduction (ASR) rules** — Microsoft Defender rules that block specific LOLBin abuse patterns

## Key EDR/Sysmon Exam Concepts

- **Sysmon EID 1** — process creation with full command line; most-used detection event
- **Sysmon EID 10** — ProcessAccess on LSASS = credential dumping attempt
- **Sysmon EID 3** — network connection by process; critical for C2 detection
- **LOLBins** — legitimate binaries used maliciously; encoded PS, certutil download, mshta execution
- **Parent-child anomalies** — Office apps spawning cmd/PS is almost always malicious
- **XDR** extends EDR with cross-platform correlation; EDR is endpoint-only
