# Windows Event ID Cheatsheet

## Overview — CS0-003 Domain 1

Windows Security Event Log and Sysmon are the two primary endpoint data sources for a Windows-focused SOC. This cheatsheet covers the event IDs most likely to appear on the CySA+ exam, their detection significance, and analyst use cases. Cross-reference with Endpoint-Security-and-EDR for Sysmon configuration guidance and SIEM-and-Log-Analysis for SIEM query examples.

## Windows Security Event IDs

### Authentication Events

| Event ID | Name | Analyst Use |
|---|---|---|
| **4624** | Successful Logon | Baseline normal logon patterns; alert on off-hours, unusual source IPs, unexpected logon types |
| **4625** | Failed Logon | Brute force detection — alert on N failures from same source within time window |
| **4634** | Account Logoff | Track session duration; abnormally short sessions can indicate automated access |
| **4648** | Logon Using Explicit Credentials | `runas` usage or credential passing — attacker running processes as different user |
| **4672** | Special Privileges Assigned to Logon | Privileged logon (admin/SeDebugPrivilege) — monitor for unexpected accounts |
| **4776** | NTLM Authentication Attempt | NTLM auth from domain-joined machines is suspicious when Kerberos should be used; indicates potential pass-the-hash |
| **4771** | Kerberos Pre-auth Failed | Kerberoasting reconnaissance indicator; AS-REP roasting attempts |
| **4768** | Kerberos TGT Requested | Account requesting ticket; correlate with 4769 for ticket use |
| **4769** | Kerberos Service Ticket Requested | Kerberoasting — excessive 4769 events with RC4 encryption type from one account |

### Logon Type Codes

| Logon Type | Name | Description |
|---|---|---|
| **2** | Interactive | Local keyboard/screen logon |
| **3** | Network | Mapped drive, net use, SMB access — most common for lateral movement |
| **4** | Batch | Scheduled task logon |
| **5** | Service | Service account logon at service start |
| **7** | Unlock | Workstation unlock |
| **10** | RemoteInteractive | RDP logon |
| **11** | CachedInteractive | Cached domain credential logon (offline) |

**Exam tip:** Type 3 (Network) logon on a workstation from another internal workstation = lateral movement indicator. Type 10 (RDP) logon from unexpected source = investigate immediately.

### Process and Execution Events

| Event ID | Name | Analyst Use |
|---|---|---|
| **4688** | Process Created | Requires audit process creation + command line logging enabled; detects LOLBin abuse, encoded PS, recon tools |
| **4689** | Process Terminated | Correlate with 4688; very short-lived processes are suspicious (injectors, droppers) |

**Enabling command line in 4688:**
```
Computer Configuration → Windows Settings → Security Settings →
Advanced Audit Policy → Detailed Tracking → Audit Process Creation → Success
+ enable "Include command line in process creation events" via GPO
```

### Account Management Events

| Event ID | Name | Analyst Use |
|---|---|---|
| **4720** | User Account Created | Alert on accounts created outside change management — especially outside business hours |
| **4722** | User Account Enabled | Re-enabled dormant accounts — possible attacker backdoor |
| **4723** | Password Change Attempt | User-initiated; alert if service account |
| **4724** | Password Reset Attempt | Admin reset; monitor for unauthorized admin password resets |
| **4725** | User Account Disabled | Could indicate incident response action or attacker covering tracks |
| **4726** | User Account Deleted | Attacker removing backdoor account; investigate preceding 4720 |
| **4732** | Member Added to Security-Enabled Local Group | Adding to Administrators group — privilege escalation indicator |
| **4728** | Member Added to Security-Enabled Global Group | Domain group membership change — Domain Admins additions critical |
| **4756** | Member Added to Security-Enabled Universal Group | Enterprise Admins additions |

### Service and Scheduled Task Events

| Event ID | Name | Analyst Use |
|---|---|---|
| **4697** | Service Installed in System | Malware often installs as a service for persistence; alert on new services |
| **7045** | New Service Installed (System log) | Same as 4697 but in System log — check both; some tools only write here |
| **4698** | Scheduled Task Created | Persistence mechanism; alert on tasks created outside change management |
| **4702** | Scheduled Task Updated | Modification of existing task — attacker may hijack legitimate task |
| **4699** | Scheduled Task Deleted | Attacker removing evidence; correlate with preceding 4698 |

### Privilege and Access Events

| Event ID | Name | Analyst Use |
|---|---|---|
| **4673** | Sensitive Privilege Use | SeDebugPrivilege, SeTcbPrivilege — process injection and token impersonation |
| **4674** | Operation Attempted on Privileged Object | Sensitive object access — failed attempts indicate reconnaissance |
| **5140** | Network Share Object Accessed | SMB share access — lateral movement via ADMIN$, C$ |
| **5145** | Detailed File Share Access | File/folder-level share access; high volume = potential data staging |

### Audit and Log Integrity

| Event ID | Name | Analyst Use |
|---|---|---|
| **1102** | Audit Log Cleared (Security log) | High-priority alert — attackers clear logs to cover tracks; treat as confirmed compromise |
| **104** | Event Log Cleared (System log) | Same intent; System log variant |

**Exam tip:** Event ID 1102 (audit log cleared) should trigger an immediate P1 response. There is almost no legitimate reason to clear the Security event log.

---

## Sysmon Event IDs

Sysmon supplements native Windows logging. These events are written to `Microsoft-Windows-Sysmon/Operational`.

| Event ID | Name | Key Fields | Detection Use |
|---|---|---|---|
| **1** | Process Create | Image, CommandLine, ParentImage, Hashes, User | LOLBin detection, encoded commands, parent-child anomalies |
| **2** | File Creation Time Changed | Timestomping indicator — attacker modifying file metadata to evade timeline analysis |
| **3** | Network Connection | Image, DestinationIp, DestinationPort | C2 detection, beaconing; correlate process to outbound connection |
| **5** | Process Terminated | Short-lived processes; correlate with EID 1 |
| **6** | Driver Loaded | Signed status; unsigned/anomalous drivers = rootkit indicator |
| **7** | Image Loaded (DLL) | ImageLoaded, Signed, Signature | DLL hijacking, reflective DLL loading — unsigned DLLs in suspicious paths |
| **8** | CreateRemoteThread | SourceImage, TargetImage | Process injection — thread created in another process |
| **9** | RawAccessRead | Process reading raw disk — bypassing file system to access MBR/SAM |
| **10** | ProcessAccess | SourceImage, TargetImage, GrantedAccess | LSASS access (credential dumping), hollowing detection |
| **11** | FileCreate | TargetFilename | Executable dropped to temp/downloads, ransomware file creation |
| **12/13/14** | Registry Event | TargetObject, Details | Persistence via Run keys, service keys, COM hijacking |
| **15** | FileCreateStreamHash | ADS creation — hiding executables in alternate data streams |
| **17/18** | Pipe Created/Connected | Named pipe creation — lateral movement via PsExec, Cobalt Strike pipes |
| **22** | DNS Query | QueryName, QueryResults | C2 domain resolution; DNS tunneling; first-seen domain |
| **23** | File Delete | Attacker cleanup, ransomware pre-encrypt original deletion |
| **25** | Process Tampering | Process image swapped — process hollowing indicator |

### Key GrantedAccess Masks for EID 10 (LSASS)

| Mask | Meaning | Context |
|---|---|---|
| `0x1010` | PROCESS_VM_READ + PROCESS_QUERY_LIMITED | Mimikatz typical access |
| `0x1410` | PROCESS_VM_READ + PROCESS_QUERY + PROCESS_VM_WRITE | More aggressive dump |
| `0x0040` | PROCESS_DUP_HANDLE | Handle duplication technique |

---

## Quick Reference: Top 10 Most Exam-Critical Event IDs

| Priority | Event ID | Why It Matters |
|---|---|---|
| 1 | **1102** | Audit log cleared = almost certainly malicious |
| 2 | **4624 / 4625** | Authentication success/failure = brute force, lateral movement |
| 3 | **Sysmon 1** | Process creation with command line = execution detection |
| 4 | **Sysmon 10** | LSASS access = credential dumping |
| 5 | **4720 / 4732** | Account creation, admin group add = persistence/privesc |
| 6 | **4688** | Native process creation (if Sysmon not deployed) |
| 7 | **4697 / 7045** | Service installation = persistence |
| 8 | **4698** | Scheduled task creation = persistence |
| 9 | **5140** | Admin share access = lateral movement |
| 10 | **Sysmon 3** | Network connection by process = C2 |
