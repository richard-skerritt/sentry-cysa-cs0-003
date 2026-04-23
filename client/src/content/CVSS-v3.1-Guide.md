# CVSS v3.1 Guide

## Overview — CS0-003 Domain 2

**CVSS (Common Vulnerability Scoring System) v3.1** provides a standardized, open framework for communicating the characteristics and severity of software vulnerabilities. CySA+ expects you to interpret scores, understand metric groups, apply the severity bands, and — critically — understand why CVSS alone is insufficient for vulnerability prioritization. See Vulnerability-Management for the full prioritization workflow.

## CVSS Metric Groups

CVSS v3.1 has three metric groups. The **Base Score** is the universally published score; Temporal and Environmental are rarely seen in vulnerability scanner outputs but are tested on the exam.

| Group | Purpose | Who Sets It |
|---|---|---|
| **Base** | Intrinsic characteristics of the vulnerability; doesn't change over time or context | Vulnerability researcher / NVD |
| **Temporal** | Characteristics that change over time (exploit maturity, patch availability) | Analysts, vendors |
| **Environmental** | Adjustments for a specific organization's context (asset criticality, compensating controls) | Organization's security team |

**Full score = Base + Temporal adjustments + Environmental adjustments.** Most tools only display the Base Score.

---

## Base Metric Definitions

### Exploitability Metrics (How hard is it to exploit?)

| Metric | Abbreviation | Values | Description |
|---|---|---|---|
| **Attack Vector** | AV | Network (N), Adjacent (A), Local (L), Physical (P) | Where must the attacker be to exploit? |
| **Attack Complexity** | AC | Low (L), High (H) | How much effort/luck does exploitation require? |
| **Privileges Required** | PR | None (N), Low (L), High (H) | What access must the attacker already have? |
| **User Interaction** | UI | None (N), Required (R) | Does a victim need to take an action? |

**Scoring intuition:**
- AV:Network + AC:Low + PR:None + UI:None = trivially exploitable remotely with no prerequisites = scores highest
- AV:Physical = attacker must physically touch the device = scores lowest

### Scope (S)

- **Unchanged (U)** — exploiting the vulnerability only impacts resources within the same security authority (e.g., the vulnerable application itself)
- **Changed (C)** — exploitation can impact resources beyond the vulnerable component (e.g., a sandbox escape that affects the host OS)

Scope:Changed significantly raises the score and is seen in hypervisor escapes, container breakouts, browser sandbox escapes.

### Impact Metrics (How bad is successful exploitation?)

| Metric | Abbreviation | Values | Description |
|---|---|---|---|
| **Confidentiality** | C | None (N), Low (L), High (H) | Impact on data confidentiality |
| **Integrity** | I | None (N), Low (L), High (H) | Impact on data integrity |
| **Availability** | A | None (N), Low (L), High (H) | Impact on system/service availability |

**High on all three C/I/A = maximum impact = pushes toward Critical score**

---

## Severity Bands

| Score Range | Severity |
|---|---|
| 0.0 | None |
| 0.1 – 3.9 | Low |
| 4.0 – 6.9 | Medium |
| 7.0 – 8.9 | High |
| 9.0 – 10.0 | Critical |

**Exam trap:** A Critical CVSS (9.0–10.0) on a system with no internet exposure and full compensating controls may be lower actual priority than a High CVSS (7.5) on an internet-facing system with a publicly known, actively exploited CVE.

---

## Temporal Metrics

Temporal metrics adjust the Base Score based on current real-world conditions.

| Metric | Values | Impact |
|---|---|---|
| **Exploit Code Maturity (E)** | Not Defined / Unproven / POC / Functional / High | Functional/High exploit = score increases |
| **Remediation Level (RL)** | Not Defined / Official Fix / Temporary Fix / Workaround / Unavailable | Official fix available = score decreases |
| **Report Confidence (RC)** | Not Defined / Unknown / Reasonable / Confirmed | Confirmed = score stays; Unknown = decreases |

**Practical use:** When a 0-day is disclosed with no patch (RL:Unavailable) and a working public exploit (E:High), the Temporal score significantly exceeds the initial Base Score.

---

## Environmental Metrics

Environmental metrics let an organization tune the score for their specific context. They adjust two things:

1. **Modified Base Metrics** — override any Base metric to reflect actual exposure in your environment (e.g., a network vulnerability on an air-gapped system: modify AV from Network to Local)
2. **Impact Subscore Modifiers** — Confidentiality Requirement (CR), Integrity Requirement (IR), Availability Requirement (AR) — weight impact based on asset criticality

**Example:** A vulnerability with C:H on a system that stores no sensitive data → set CR:Low → Environmental score decreases, reflecting actual business impact.

---

## EPSS — Exploit Prediction Scoring System

**EPSS (Exploit Prediction Scoring System)** is a CVSS complement, not a replacement. It uses machine learning to predict the probability that a given CVE will be exploited in the wild within the next 30 days.

| Score | Interpretation |
|---|---|
| 0.00 – 0.10 | Low probability of exploitation |
| 0.10 – 0.50 | Moderate; monitor |
| 0.50 – 1.00 | High probability; prioritize |

**Key insight:** Only ~5% of published CVEs are ever exploited. EPSS identifies which 5% are actually at risk. A CVE with CVSS 9.8 and EPSS 0.003 is a lower operational priority than a CVSS 6.5 with EPSS 0.91.

---

## CISA KEV — Known Exploited Vulnerabilities Catalog

CISA's **KEV catalog** (cisa.gov/known-exploited-vulnerabilities-catalog) lists CVEs with confirmed active exploitation in the wild. Federal agencies (FCEB) are required to remediate KEV entries by specific deadlines; private sector organizations treat KEV as a highest-priority remediation queue.

**If a CVE is in KEV:**
- Treat it as Priority 1 regardless of CVSS score
- Remediation SLA typically 15 days or less
- Document exception with CISO sign-off if SLA cannot be met

---

## Why CVSS Alone Is Not a Priority

This is one of the most important exam concepts in Domain 2. CVSS measures vulnerability severity in a vacuum; it does not measure risk.

### Risk vs Severity

**Risk = Severity × Exposure × Exploitability × Business Impact**

CVSS captures severity. It does not capture:
- Whether the asset is internet-facing
- Whether a public exploit exists (Temporal)
- Whether your organization actually runs the vulnerable software in an exposed configuration
- How critical the business data on that system is
- Whether compensating controls (WAF, network segmentation) reduce effective exploitability

### Prioritization Decision Framework

```
Step 1: Is CVE in CISA KEV?               → Yes = Highest Priority
Step 2: Is EPSS > 0.5?                    → Yes = Elevated Priority
Step 3: What is the CVSS Base Score?      → Sets baseline severity tier
Step 4: Is the asset internet-facing?     → Yes = Increase priority
Step 5: What is the asset's criticality? → Critical business system = Increase priority
Step 6: Are compensating controls active? → WAF/segmentation = Decrease effective priority
```

---

## CVSS Quick Reference

```
CVSSv3.1 Vector String Example:
CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H
         ↑    ↑   ↑    ↑   ↑   ↑   ↑   ↑   ↑
         |    |   |    |   |   |   |   |   Availability:High
         |    |   |    |   |   |   |   Integrity:High
         |    |   |    |   |   |   Confidentiality:High
         |    |   |    |   |   Scope:Unchanged
         |    |   |    |   UserInteraction:None
         |    |   |    PrivilegesRequired:None
         |    |   AttackComplexity:Low
         |    AttackVector:Network
         Version 3.1
Score = 9.8 (Critical) — remote, no auth, no user interaction, full C/I/A impact
```
