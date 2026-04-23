# Regulatory Compliance Cheatsheet

## Overview — CS0-003 Domain 4

Security analysts are expected to understand the key compliance frameworks and privacy regulations their organization operates under — not to be lawyers, but to know when to escalate, what thresholds trigger mandatory action, and how frameworks shape security program requirements. This cheatsheet covers the regulations and standards most likely to appear on CySA+.

---

## Breach Notification Requirements

### GDPR — General Data Protection Regulation (EU)

- **Scope:** Any organization that processes personal data of EU residents, regardless of where the organization is located
- **Breach notification to authority:** Within **72 hours** of becoming aware of the breach; notify the relevant supervisory authority (e.g., ICO in UK, CNIL in France)
- **Notification to individuals:** "Without undue delay" if the breach is likely to result in high risk to their rights and freedoms
- **Key definitions:** Personal data = any info relating to an identified or identifiable natural person
- **Key obligations:** Data minimization, purpose limitation, right to erasure ("right to be forgotten"), privacy by design
- **Penalties:** Up to €20 million or 4% of global annual turnover, whichever is higher

### HIPAA — Health Insurance Portability and Accountability Act (US)

- **Scope:** Covered entities (healthcare providers, health plans) and their business associates
- **Breach notification to HHS:** Within **60 days** of discovery
- **Breach notification to individuals:** Same 60-day requirement
- **Media notification:** If breach affects 500+ residents of a state, notify prominent media within 60 days
- **Annual report to HHS:** For breaches affecting fewer than 500 individuals — aggregate report by March 1 of the following year
- **Safeguards required:** Administrative, physical, and technical safeguards for PHI (Protected Health Information)
- **Penalties:** Up to $1.9 million per violation category per year; criminal penalties for willful neglect

### PCI-DSS 4.0 — Payment Card Industry Data Security Standard

- **Scope:** Any entity that stores, processes, or transmits cardholder data (CHD) or SAD (Sensitive Authentication Data)
- **No mandated breach notification timeline** within PCI-DSS itself — but card brands (Visa, Mastercard) have their own notification requirements (typically 24–72 hours)
- **Key requirements:**
  - Req 1–2: Install and maintain network security controls; apply secure configs
  - Req 3–4: Protect stored cardholder data; protect data in transit with strong cryptography
  - Req 5–6: Protect against malware; develop and maintain secure systems
  - Req 7–8: Restrict access by need-to-know; identify users and authenticate access
  - Req 10: Log and monitor all access to system components and cardholder data
  - Req 11: Test security of systems and networks regularly (quarterly scans, annual pen test)
  - Req 12: Support information security with organizational policies
- **PCI-DSS 4.0 additions:** Targeted risk analysis for some controls (customize requirements to risk), MFA now required for all access to CDE, updated password requirements (12 chars minimum)
- **Compliance validation:** QSA (Qualified Security Assessor) for large merchants; SAQ (Self-Assessment Questionnaire) for smaller merchants

### SOX — Sarbanes-Oxley Act (US)

- **Scope:** Publicly traded companies in the US (and their foreign private issuers)
- **Security relevance:** Section 302 (CEO/CFO certify accuracy of financial reports) and Section 404 (management and auditor must assess internal controls over financial reporting)
- **IT controls:** Access controls, change management, audit trails for financial systems are all in-scope as IT General Controls (ITGC)
- **No specific breach notification requirement** in SOX — but inadequate internal controls can trigger restatement obligations
- **Penalties:** Willful falsification of records: up to 20 years imprisonment

---

## US Privacy Laws

### CCPA / CPRA — California Consumer Privacy Act / Privacy Rights Act

- **Scope:** For-profit businesses meeting size thresholds that collect personal information of California residents
- **Key rights:** Right to know, right to delete, right to opt-out of sale, right to correct, right to limit use of sensitive personal information (CPRA addition)
- **Breach notification:** California's breach notification law (separate from CCPA) requires notification in the most expedient time possible and without unreasonable delay
- **Penalties:** $2,500 per unintentional violation, $7,500 per intentional violation; private right of action for data breaches

### State Breach Notification Laws (US)

All 50 US states have breach notification laws. Common elements:

| Element | Typical Requirement |
|---|---|
| **Timing** | "Without unreasonable delay" / 30–90 days (varies by state) |
| **Who to notify** | Affected residents + state AG (many states) |
| **What triggers notification** | Unauthorized acquisition of unencrypted personal information |
| **PII definition** | SSN, driver's license, financial account numbers; states vary |
| **Exemptions** | Encrypted data generally exempt; some states require risk of harm assessment |

**Notable state-specific requirements:**
- **New York SHIELD Act:** Reasonable security requirements; notification without unreasonable delay
- **Massachusetts 201 CMR 17.00:** Written information security program (WISP) required
- **Texas:** 60 days if affecting 250+ Texas residents

---

## Security Frameworks

### NIST Cybersecurity Framework (CSF)

- **Structure:** Five core functions — **Identify, Protect, Detect, Respond, Recover**
- **Not mandatory** (except for critical infrastructure by executive order); widely adopted as best practice
- **NIST CSF 2.0** adds **Govern** as a sixth function (organizational risk governance)
- **Profiles:** Current state vs. target state; gaps drive prioritization

### NIST SP 800-53

- **Full control catalog** for federal information systems; organized into control families
- **Used for:** FedRAMP, FISMA compliance; DoD environments
- **Control families:** AC (Access Control), AU (Audit), IR (Incident Response), RA (Risk Assessment), SC (System/Communications Protection), SI (System/Info Integrity), etc.
- **Impact levels:** Low, Moderate, High — determine which controls apply

### ISO/IEC 27001

- **International standard** for Information Security Management Systems (ISMS)
- **Certifiable** — third-party audit leads to ISO 27001 certification; demonstrates security posture to customers
- **Annex A controls:** 93 controls across 4 themes (Organizational, People, Physical, Technological)
- **PDCA cycle:** Plan-Do-Check-Act continuous improvement model
- **Key difference from NIST:** ISO 27001 is certifiable; NIST CSF/800-53 are frameworks/catalogs, not certifications

### SOC 2

- **AICPA standard** for service organizations; demonstrates security/availability/privacy controls to customers
- **Two types:** Type I (controls designed appropriately at a point in time) vs. Type II (controls operating effectively over a 6–12 month period — much more meaningful)
- **Trust Service Criteria (TSC):**
  - **Security (CC)** — mandatory for all SOC 2 reports (Common Criteria)
  - **Availability (A)** — system available for operation and use
  - **Processing Integrity (PI)** — system processing is complete, accurate, and authorized
  - **Confidentiality (C)** — information designated confidential is protected
  - **Privacy (P)** — personal information collected, used, retained, disclosed, and disposed per privacy notice

---

## Framework Comparison Table

| Framework | Type | Mandatory? | Certification? | Primary Audience |
|---|---|---|---|---|
| **GDPR** | Regulation | Yes (EU/EEA) | No | Any org with EU resident data |
| **HIPAA** | Regulation | Yes (US healthcare) | No | Covered entities + BAs |
| **PCI-DSS 4.0** | Standard | Yes (card processing) | QSA audit | Payment card handlers |
| **SOX** | Regulation | Yes (US public cos) | No | Public company finance/IT |
| **CCPA/CPRA** | Regulation | Yes (CA threshold) | No | For-profit orgs with CA residents |
| **NIST CSF** | Framework | No (recommended) | No | All organizations |
| **NIST 800-53** | Control catalog | Yes (federal) | No | Federal agencies, FedRAMP |
| **ISO 27001** | Standard | No | Yes | Any organization |
| **SOC 2** | Attestation | No | Yes (Type I/II) | Service organizations |

---

## Breach Notification Quick Reference

| Regulation | To Whom | Deadline |
|---|---|---|
| **GDPR** | Supervisory authority | 72 hours |
| **GDPR** | Affected individuals | Without undue delay (high risk) |
| **HIPAA** | HHS + individuals | 60 days |
| **HIPAA** | Media (500+ in state) | 60 days |
| **PCI-DSS** | Card brands | 24–72 hours (brand-specific) |
| **State laws (US)** | Residents + AG | Varies; typically 30–90 days |

**Exam tip:** GDPR 72 hours is the most commonly tested notification deadline. HIPAA 60 days is the second most tested. PCI has no built-in deadline — the deadline is set by card brands.
