# Incident Response Lifecycle

## Overview — CS0-003 Domain 3

The **NIST SP 800-61** incident response lifecycle is the authoritative framework for CySA+. The acronym **PICERL** — Preparation, Identification, Containment, Eradication, Recovery, Lessons Learned — maps to the four NIST phases (Preparation | Detection & Analysis | Containment/Eradication/Recovery | Post-Incident). Know every phase's goals, activities, and common failure modes.

## NIST 800-61 PICERL Framework

```
Preparation → Identification → Containment → Eradication → Recovery → Lessons Learned
                    ↑                                                         ↓
                    └─────────────── Continuous Improvement ─────────────────┘
```

---

## Phase 1 — Preparation

### Goals
- Ensure the organization can respond effectively before an incident occurs
- Build capability, not just documentation

### Key Activities

- **IR Policy and Plan** — documented roles, escalation paths, authority matrix (who can authorize containment actions)
- **Playbooks** — pre-built, tested response procedures for common attack types (see IR-Playbooks-by-Attack-Type)
- **Communication templates** — pre-approved language for legal, PR, exec notifications
- **IR team composition** — define CSIRT members: security analyst, IR lead, legal, IT ops, HR, communications
- **Tooling readiness** — forensic workstations, write blockers, imaging media, out-of-band comms (if primary network is compromised)
- **Tabletop exercises** — simulate attack scenarios with key stakeholders; identify gaps before real events
- **Asset inventory** — you cannot protect or investigate what you don't know exists (see SIEM-and-Log-Analysis)
- **Legal agreements** — retainer with external IR firm; NDA with third-party forensics

### Common Mistakes
- IR plan exists but hasn't been tested or updated in 2+ years
- No defined authority for who can isolate a system (causes delays during containment)
- Forensic tools not pre-installed or licensed — discovered during a live incident

---

## Phase 2 — Identification (Detection & Analysis)

### Goals
- Detect events, determine if they constitute an incident, and characterize scope and severity

### Key Activities

- **Event triage** — distinguish true positives from false positives using SIEM alerts, EDR telemetry, user reports
- **Incident declaration** — define threshold for declaring an incident vs event vs anomaly
- **Initial scoping** — how many systems? What data? What is the blast radius?
- **Severity classification** — P1 (critical business impact) → P4 (low/informational); drives escalation and SLA
- **Evidence preservation begins here** — note timestamps, take screenshots, begin chain of custody
- **Timeline construction** — map earliest known malicious activity; distinguish first event from first detected event

### Incident Severity Matrix (Example)

| Severity | Criteria | Response SLA |
|---|---|---|
| **P1 Critical** | Ransomware, data breach, critical infra down | Immediate, 24/7 response |
| **P2 High** | Active lateral movement, C2 confirmed | 2-hour response |
| **P3 Medium** | Malware on isolated endpoint, phishing clicked | Business hours, 8h |
| **P4 Low** | Policy violation, failed attack attempt | Next business day |

### Common Mistakes
- **Alert fatigue** causes analysts to dismiss real incidents as false positives
- Failing to preserve evidence during initial triage (investigating a live system modifies it)
- Insufficient logging means timeline gaps — can't determine first-touch time

---

## Phase 3 — Containment

### Goals
- Stop the bleeding; limit damage and prevent spread

### Short-Term vs Long-Term Containment

| Type | Action | When |
|---|---|---|
| **Short-term** | Network isolate host, disable account, null-route IP | Immediate; buys time |
| **Long-term** | Rebuild compromised system, rotate all credentials, segment network | After investigation is sufficiently complete |

### Key Activities

- **Network isolation** — remove compromised host from network (VLAN change, ACL, EDR isolation feature); maintain enough connectivity for forensics if possible
- **Account disable** — disable (not delete) compromised accounts; preserve audit trail
- **Credential rotation** — if credentials are confirmed or suspected stolen, rotate immediately for affected accounts
- **Block IOCs** — push hash, IP, domain blocks to firewall, proxy, EDR
- **Evidence collection** — memory dump, disk image, log preservation before eradication (see Digital-Forensics-and-Malware-Analysis)
- **Preserve over remediate** — collect evidence first, remediate second

### Common Mistakes
- **Eradicating before containing** — wiping a system before isolating it can cause spread or destroy evidence
- **Alerting the attacker** — containment actions visible in environment can trigger attacker to pivot, exfiltrate faster, or detonate ransomware early
- **Deleting instead of disabling** accounts — loses forensic audit trail

---

## Phase 4 — Eradication

### Goals
- Remove the adversary and all artifacts from the environment

### Key Activities

- Identify and remove all malware, backdoors, persistence mechanisms
- **Persistence hunting** — scheduled tasks, services, registry run keys, startup folders, WMI subscriptions, cron jobs (see Endpoint-Security-and-EDR)
- Remove attacker-created accounts
- Patch exploited vulnerabilities (see Vulnerability-Management)
- Reset all potentially compromised credentials — not just the known ones
- Validate eradication across all affected systems — eradication of one system is incomplete if lateral movement occurred

### Common Mistakes
- **Partial eradication** — removing visible malware but missing a backdoor or persistence mechanism
- Patching without investigating how entry occurred — adversary re-exploits within hours
- Assuming eradication is complete because AV scan is clean — AV misses fileless, LOLBin-based persistence

---

## Phase 5 — Recovery

### Goals
- Restore systems to normal operation with confidence they are clean

### Key Activities

- Restore from **known-good backups** — verify backup integrity and creation date predates compromise
- Rebuild systems from gold images where feasible — more trustworthy than "cleaned" systems
- Monitor recovered systems intensively for 30 days minimum — watch for reinfection
- Phased restoration — critical systems first, validate, then expand
- Validate **business functionality** before declaring recovery complete

### Common Mistakes
- Restoring from a backup that was already infected
- Rushing recovery under business pressure before eradication is confirmed complete — attacker is still present
- Not rotating credentials after recovery — stolen creds still valid

---

## Phase 6 — Lessons Learned

### Goals
- Improve the program; prevent recurrence; fulfill reporting obligations

### Key Activities

- **Post-incident review (PIR)** — conduct within 2 weeks while memory is fresh
- Identify what worked, what failed, and what was missing
- Update IR playbooks based on gaps discovered
- Submit metrics: time to detect, time to contain, total duration, systems affected, data exposed
- **Root cause analysis** — determine original entry vector; address systemic weakness, not just symptoms
- **Regulatory reporting** — determine if breach notification is required (see Regulatory-Compliance-Cheatsheet)
- Share sanitized findings with threat intel community (ISACs) if appropriate

### PIR Questions

- When was the initial compromise vs when was it detected? (detection gap)
- Did existing controls work? Why or why not?
- Were playbooks followed? Were they adequate?
- What evidence was missing or insufficient?
- Were stakeholders notified appropriately and timely?

---

## Key PICERL Exam Tips

- **Order matters** — Containment before Eradication; Eradication before Recovery
- **Evidence preservation** begins during Identification, not after
- **Lessons Learned is mandatory**, not optional — skipping it repeats mistakes
- Tabletop exercises belong in **Preparation**, not any reactive phase
- **NIST 800-61** is the canonical reference — know the four phases and their mapping to PICERL
