# SIEM and Log Analysis

## Overview — CS0-003 Domain 1

A **SIEM (Security Information and Event Management)** platform is the nerve center of a SOC. It ingests logs from across the environment, normalizes them into a common schema, applies correlation rules, and surfaces alerts for analyst triage. Understanding SIEM architecture, log sources, search syntax, and tuning discipline is essential for CySA+.

## SIEM Architecture

### Core Components

- **Log collectors / forwarders** — lightweight agents (Splunk Universal Forwarder, Elastic Beats, NXLog) or syslog receivers that ship raw events to the indexer
- **Indexer / data store** — parses, normalizes, and indexes events for fast search (Splunk indexer, Elasticsearch)
- **Search head / UI** — analyst-facing query interface and dashboard layer
- **Correlation engine** — evaluates incoming events against rules in near-real-time; fires alerts on matches
- **Threat intelligence feeds** — enrichment layer that tags IPs, domains, and hashes against known-bad indicators
- **SOAR integration** — automated response playbooks triggered by SIEM alerts (see IR-Playbooks-by-Attack-Type)

### Deployment Models

| Model | Description | Trade-off |
|---|---|---|
| On-premises | Full control, data stays in network | High infrastructure overhead |
| Cloud-native | Sentinel, Chronicle, Elastic Cloud | Lower ops burden, egress costs |
| Hybrid | Local collection + cloud indexing | Balances latency and cost |
| MSSP/MDR | Outsourced SOC monitors SIEM | Less visibility into raw data |

## Log Sources

### Endpoint Logs

- **Windows Security Event Log** — authentication, privilege use, process creation (see Windows-Event-ID-Cheatsheet)
- **Sysmon** — enriched process, network, file, registry events; critical for detection fidelity
- **EDR telemetry** — process trees, memory indicators, lateral movement paths (see Endpoint-Security-and-EDR)
- **Linux auditd** — syscall-level logging; `/var/log/auth.log`, `/var/log/secure`

### Network Logs

- **Firewall / NGFW** — allow/deny with 5-tuple (src IP, dst IP, src port, dst port, protocol)
- **Proxy / web gateway** — full URL, user-agent, content type, response code
- **DNS logs** — query name, record type, response; invaluable for detecting tunneling and C2
- **NetFlow / IPFIX** — metadata only, no payload; good for volume/behavior baselines (see Network-Security-Monitoring)
- **IDS/IPS alerts** — Snort/Suricata rule matches with signature ID and severity

### Application & Infrastructure Logs

- **Active Directory / LDAP** — logon events, group changes, replication errors
- **Web servers** — Apache/Nginx access logs: method, URI, status, bytes, referrer, user-agent
- **Cloud platform logs** — CloudTrail, VPC Flow, Azure Activity, GCP Audit (see Cloud-Security-Operations)
- **Email gateway** — sender, recipient, subject, attachment hash, disposition (quarantine/deliver)
- **Authentication platforms** — Okta, Azure AD Sign-In, Duo — MFA push results, impossible-travel

## Log Parsing and Normalization

Raw logs arrive in dozens of formats. A SIEM must parse them into **common fields** before correlation can work.

### Key Common Fields

| Field | Description |
|---|---|
| `timestamp` | Normalized UTC; clock skew breaks correlation |
| `src_ip` / `dst_ip` | Source and destination IP |
| `src_port` / `dst_port` | Transport-layer ports |
| `user` | Account performing action |
| `host` / `hostname` | Originating system |
| `action` | allowed, denied, blocked, executed |
| `event_id` | Source-native event code |
| `severity` | Normalized severity (info/low/medium/high/critical) |

**Parser issues to watch:**
- Multiline events (stack traces) parsed as multiple records
- Timezone mismatches creating phantom sequences
- Field extraction failures leaving critical fields null — alerts depending on those fields silently fail

## Correlation Rules

A correlation rule defines a pattern across one or more events within a time window that indicates a potential threat.

### Rule Anatomy

```
Rule: Brute Force Detection
Logic: count(EventID=4625) WHERE same TargetUserName > 10 WITHIN 5 minutes
Action: Generate HIGH alert, tag src_ip
```

### Common Correlation Patterns

- **Threshold** — N events of type X in T minutes (brute force, scan detection)
- **Sequence** — A then B in order within window (recon → exploitation chain)
- **Whitelist deviation** — event seen from asset not in approved list
- **Rare / first-seen** — process/domain never seen in environment before (requires baseline)
- **Aggregation + join** — failed auth on host followed by successful auth from same IP

## Search Query Examples

### Splunk SPL

```spl
# Failed logons in last 24h grouped by user
index=wineventlog EventCode=4625 earliest=-24h
| stats count by TargetUserName, src_ip
| where count > 5
| sort -count

# DNS requests to rare domains
index=dns_logs
| rare limit=20 query
| where NOT match(query, "microsoft|google|windows")

# Lateral movement: new process spawned by cmd.exe over network logon
index=wineventlog EventCode=4688 ParentProcessName="*\\cmd.exe"
| join type=inner host [search index=wineventlog EventCode=4624 LogonType=3]
```

### KQL (Microsoft Sentinel / Defender)

```kql
// Failed sign-ins > 10 in 1h, same account
SigninLogs
| where TimeGenerated > ago(1h)
| where ResultType != "0"
| summarize FailCount=count() by UserPrincipalName, IPAddress
| where FailCount > 10

// Process creation with encoded PowerShell
DeviceProcessEvents
| where ProcessCommandLine contains "-EncodedCommand"
| project Timestamp, DeviceName, AccountName, ProcessCommandLine
```

## Alert Tuning and False Positive Management

**False positives** erode analyst trust and cause alert fatigue — the #1 reason detections get disabled. Tuning is not optional.

### Tuning Strategies

- **Whitelist / allowlist** — suppress known-good sources (vulnerability scanners, backup agents, service accounts) per rule
- **Threshold adjustment** — raise count thresholds after baselining normal volumes; document the change
- **Contextual suppression** — suppress alert only when specific asset tag or subnet matches (e.g., IT admin workstations for PSExec)
- **Time-based suppression** — disable noisy rule during maintenance windows
- **Enrichment-based filtering** — only alert if src_ip NOT in `trusted_scanner` lookup table

### False Positive vs False Negative Trade-off

| Decision | Risk |
|---|---|
| Over-tune (suppress too much) | Miss real attacks (false negatives) |
| Under-tune (alert on everything) | Alert fatigue, analysts miss real events |

**Exam tip:** Always document why a suppression was added, who approved it, and when it expires. Undocumented suppressions become permanent blind spots.

## Alerting Best Practices

- Set alert **priority** based on asset criticality × technique severity × confidence
- Include **response guidance** directly in the alert: what to look at first, who to escalate to
- Use **enrichment at alert time**: resolve IP to hostname, lookup user in HR system, check reputation feeds
- **Deduplicate** alerts — a single scanning IP triggering 10,000 identical alerts is one incident, not 10,000
- Review **mean time to detect (MTTD)** and **mean time to respond (MTTR)** monthly; both are CySA+ KPIs

## Log Retention Considerations

- Typical compliance minimums: PCI-DSS requires 1 year (3 months online); HIPAA requires 6 years for audit logs
- Hot/warm/cold tiering: recent data in fast storage, older data compressed to object storage
- **Legal hold** — when litigation is anticipated, retention policies must be suspended for relevant data
- Compressed offline logs must still be searchable for incident investigations (see Digital-Forensics-and-Malware-Analysis)
