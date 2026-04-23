# IR Playbooks by Attack Type

## Overview — CS0-003 Domain 3

IR playbooks are pre-documented, tested response procedures for common attack types. They accelerate response time, reduce analyst decision fatigue during high-stress incidents, and ensure critical steps are not missed. CySA+ tests your knowledge of which actions come first, what evidence to collect, and who needs to be notified. Always reference the full PICERL lifecycle in Incident-Response-Lifecycle alongside these playbooks.

---

## Playbook 1 — Ransomware

### Containment-First Step
**Immediately isolate** all suspected systems from the network. Use EDR isolation feature, VLAN change, or physical disconnection. Do not shut down — memory contains encryption keys potentially recoverable by forensics.

### Evidence to Collect
- Memory dump of affected systems (before shutdown) — may contain encryption keys or C2 details
- Disk image of a representative affected system (full forensic image)
- List of encrypted files and ransom note files (filename, extension, locations)
- Windows Event logs (4688, 7045, Sysmon EID 1/11) — capture before potential loss
- Network logs: connections made in the 24–72 hours before symptoms appeared
- EDR telemetry: process tree showing ransomware execution chain
- VSS deletion events: `vssadmin delete shadows` in EID 4688 or Sysmon EID 1

### Stakeholders to Notify
- **CISO / Legal** — immediately; legal may route communications through counsel for privilege
- **Executive leadership** — business impact assessment, ransom payment decision authority
- **IT Operations** — initiate backup restoration planning; identify clean restoration points
- **HR/Legal** — if employee data is involved
- **Cyber insurance carrier** — required notification; may provide IR firm contacts
- **Law enforcement (FBI)** — recommended; IC3.gov or FBI field office; do not pay without consulting legal
- **Regulatory bodies** — if PII/PHI was encrypted/exfiltrated (GDPR 72h, HIPAA 60d — see Regulatory-Compliance-Cheatsheet)

---

## Playbook 2 — BEC / Phishing

### Containment-First Step
**Disable the compromised email account** (suspend, do not delete) and **revoke all active sessions** (OAuth tokens, browser sessions). If mail forwarding rules were created to an external address, disable them immediately.

### Evidence to Collect
- Full email headers of the phishing/BEC email
- Email gateway logs: sender, recipient, subject, attachment hash, delivery path
- Account activity logs: Azure AD Sign-In / Okta — IP, device, time of all logins in the past 30 days
- Mail audit logs: forwarding rules created, emails accessed, emails sent
- Endpoint forensics if attachment was opened: process tree, Sysmon EID 1 from Office applications
- Browser history and downloaded files on victim workstation
- Any external domains the attacker communicated with

### Stakeholders to Notify
- **Legal** — if financial transactions were misdirected (BEC fraud)
- **Finance** — verify no wire transfers or payment detail changes were made
- **IT/Help Desk** — assist with account recovery and MFA re-enrollment
- **HR** — if W-2/payroll data was requested (tax-related BEC is common)
- **Affected user** — brief them carefully; they are a victim, not a suspect (unless insider threat is suspected)
- **Banks** — if wire fraud occurred, immediate bank contact may allow recall of funds (time-critical, hours not days)

---

## Playbook 3 — Credential Theft

### Containment-First Step
**Immediately rotate all potentially compromised credentials** — do not wait for forensics confirmation. Change passwords and revoke API keys/tokens. If LSASS dump is confirmed, assume all credentials cached on that system are compromised.

### Evidence to Collect
- Sysmon EID 10 logs (ProcessAccess targeting lsass.exe)
- Windows EID 4624 with logon type 3 from the compromised host (lateral movement with stolen creds)
- EID 4648 — explicit credential use
- EDR memory scan results / `malfind` output
- Tool artifacts: procdump, Mimikatz strings, impacket logs (secretsdump.py evidence)
- Active Directory replication logs — DCSync detection (replication requests from non-DC)
- Kerberos TGS requests with RC4 encryption (Kerberoasting indicator — EID 4769)

### Stakeholders to Notify
- **IT Operations** — coordinate credential rotation at scale (domain password reset, service account rotation)
- **Application owners** — service accounts used by applications need coordinated rotation to avoid outages
- **CISO** — if domain admin credentials are compromised, treat as full domain compromise
- **Legal** — if credentials include access to PII systems

---

## Playbook 4 — Insider Threat

### Containment-First Step
**Do not alert the subject.** Coordinate with HR and Legal before any visible action. Preserve evidence covertly. If imminent harm is a concern, escalate to physical security immediately.

### Evidence to Collect
- DLP (Data Loss Prevention) alerts and logs — large file copies, email to personal address
- USB device insertion logs (EID 6416, EDR telemetry)
- Print job logs — large print volumes of sensitive documents
- Badge access logs — after-hours physical access to server rooms
- Cloud sync activity — unauthorized uploads to personal Dropbox/Google Drive
- Email and communication logs (coordinate with Legal for scope and retention)
- File access logs — which sensitive files were accessed, by whom, when (EID 4663, 5145)
- Browser history — research on data marketplaces, competitor websites

### Stakeholders to Notify
- **HR** — owns the personnel action; IR team supports, HR leads
- **Legal** — provides guidance on evidence handling, attorney-client privilege, and employment law
- **CISO** — escalate immediately
- **Physical security** — if access revocation, badge deactivation needed
- **Law enforcement** — only after Legal authorization; premature contact can compromise HR/legal strategy

---

## Playbook 5 — Data Exfiltration

### Containment-First Step
**Block exfiltration channels** — null-route destination IPs, block domains at proxy/DNS, kill active connections. For cloud storage exfiltration (S3 pre-signed URLs, personal Dropbox), coordinate with cloud provider if necessary.

### Evidence to Collect
- Proxy/firewall logs: large outbound transfers, unusual destinations, off-hours activity
- DLP alerts and blocked/allowed transfer records
- NetFlow data: high-volume outbound flows to specific external IPs
- DNS logs: queries for cloud storage services, unusual TLDs
- Endpoint file access logs: which files were staged or accessed before transfer
- Cloud logs: S3 GetObject requests, Azure Blob downloads, API calls from unusual IPs
- Network packet capture (if available) for the exfiltration timeframe

### Stakeholders to Notify
- **Legal / Privacy Officer** — determine what data was exfiltrated; triggers breach notification analysis
- **CISO / Executive leadership** — business impact assessment
- **Regulatory bodies** — if PII/PHI confirmed exfiltrated (GDPR, HIPAA, state breach laws)
- **Affected customers/users** — per regulatory and contractual requirements (see Regulatory-Compliance-Cheatsheet)

---

## Playbook 6 — DDoS

### Containment-First Step
**Contact upstream ISP / DDoS mitigation provider** (Cloudflare, Akamai, AWS Shield). Enable scrubbing center / anycast routing. Implement rate limiting and geo-block at CDN/WAF layer if traffic is regionally sourced.

### Evidence to Collect
- NetFlow / IPFIX data showing traffic volume, source distribution, protocol breakdown
- Firewall and load balancer logs during attack window
- Attack traffic samples (pcap) for mitigation signature development
- BGP routing logs if BGP hijack is suspected
- Timeline of service degradation vs. mitigation actions

### Stakeholders to Notify
- **IT Operations / NOC** — primary response team; maintain service availability
- **Executive leadership** — business continuity decision (take service down vs. fight it)
- **Communications / PR** — customer-facing service status page updates
- **ISP** — upstream mitigation, blackhole routing if needed
- **Law enforcement** — if targeted attack by known adversary or extortion DDoS

---

## Playbook 7 — Web Application Compromise

### Containment-First Step
**Take the application offline or place behind WAF in block mode** to stop active exploitation. If code injection / webshell is present, do not just kill the process — the webshell file persists.

### Evidence to Collect
- Web server access logs: source IPs, URIs, status codes, user agents, request body size
- WAF logs: blocked and allowed requests; look for SQLi/XSS/LFI patterns
- Application error logs: exceptions triggered during exploitation
- File system timeline: newly created files in web root, especially PHP/ASPX/JSP in unexpected paths
- Database audit logs: unusual queries, new accounts, schema changes
- Memory forensics: webshell content, running processes spawned from web server
- Network connections from web server process: webshells call out to C2

### Stakeholders to Notify
- **Application owner / dev team** — coordinate patching and code review
- **Legal / Privacy** — if user data (accounts, PII) was accessible via the compromise
- **Executive leadership** — if customer-facing service impacted
- **Customers** — if account data was exposed; per breach notification laws

---

## Common Exam Themes Across All Playbooks

- **Containment before eradication** — always stabilize before cleaning
- **Preserve before remediate** — collect evidence before wiping systems
- **Legal involvement is early**, not late — privilege and regulatory exposure require it
- **Insider threat** — covert; never tip off the subject
- **Ransomware** — don't shut down immediately; memory dump first
- **Credential theft** — rotate credentials broadly and quickly; assume all cached creds on affected system are stolen
