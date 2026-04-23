# Reporting and Communication

## Overview — CS0-003 Domain 4

Effective security reporting translates technical findings into actionable decisions for the right audience. A technically perfect analysis that executives cannot interpret or that attorneys cannot act on has failed its purpose. CySA+ tests your ability to write for multiple audiences, frame risk correctly, and use secure channels for sensitive findings.

## Audience-Aware Reporting

The single most common reporting mistake: delivering the same content to every audience. What a network engineer needs and what the CEO needs are fundamentally different.

### Audience Matrix

| Audience | What They Need | Language | Depth |
|---|---|---|---|
| **Executive / Board** | Business impact, risk decision, budget implication | Business, non-technical | High-level; 1-2 pages |
| **Legal / Compliance** | Evidence, timelines, regulatory exposure, privilege | Legal precision | Detailed but factual |
| **IT Operations** | Affected systems, technical remediation steps | Technical | Detailed and actionable |
| **PR / Communications** | What happened, customer impact, disclosure language | Public-safe | Approved talking points only |
| **HR** | Insider threat findings, employee data exposure | HR/policy language | Need-to-know only |
| **IR Team** | IOCs, TTPs, affected hosts, timeline | Technical detail | Maximally detailed |

## Report Structure

### Standard Security Report Sections

1. **Executive Summary** — 1 paragraph; what happened, what was impacted, what was done, what is needed
2. **Scope** — systems, time period, and methods covered by the assessment or investigation
3. **Findings** — each finding with severity, description, evidence, and affected assets
4. **Risk Analysis** — likelihood × impact matrix; business context for each finding
5. **Remediation Recommendations** — prioritized, specific, assigned to an owner with target date
6. **Evidence** — supporting artifacts (screenshots, log excerpts, forensic hashes); referenced from findings
7. **Appendices** — raw data, tool output, full IOC lists; keep out of main body

### Executive Summary Best Practices

- Lead with **business impact**, not technical details
- State what data was affected and whether it was exfiltrated (confirmed, suspected, or ruled out)
- Recommend the two or three most critical actions the executive must authorize
- Use plain language: "An attacker accessed our customer database" not "Unauthorized SQL injection resulted in exfiltration of PII from the production RDBMS"
- Include a **risk rating** clearly: Critical / High / Medium / Low

### Findings Format (Per Finding)

```
Finding ID: F-001
Title: Unpatched Critical Vulnerability on Payment Server
Severity: Critical
Affected Asset: pay-web-01 (10.0.1.50)
CVE: CVE-2024-XXXXX  CVSS: 9.8
Description: The payment processing web server is running Apache 2.4.49,
which contains a path traversal vulnerability allowing unauthenticated
remote code execution. A public exploit is available.
Evidence: [Screenshot of Nessus scan output — Appendix B, page 12]
         [Nmap banner grab output — Appendix C]
Risk: Exploitation would allow a remote attacker to execute arbitrary
commands as www-data, potentially compromising all payment card data
processed by this system.
Recommendation: Apply vendor patch (Apache 2.4.51) within 24 hours.
If patching is not immediately possible, deploy WAF rule to block
path traversal patterns.
Owner: Web Operations Team (J. Smith)
Target Date: 2024-03-20
```

## Risk Framing: Likelihood × Impact

Risk = Likelihood × Impact. Both factors must be presented together; presenting CVSS scores without business context misrepresents risk to decision-makers.

### Risk Matrix

| | **Low Impact** | **Medium Impact** | **High Impact** |
|---|---|---|---|
| **High Likelihood** | Medium | High | Critical |
| **Medium Likelihood** | Low | Medium | High |
| **Low Likelihood** | Informational | Low | Medium |

**Contextualizing risk for executives:**
- "This vulnerability has a CVSS score of 9.8" — meaningless to non-technical reader
- "This vulnerability, if exploited by a remote attacker, would give them full control of the system storing all customer credit card numbers, with a publicly available exploit and active exploitation in the wild" — actionable

## Stakeholder Map for Incidents

During an incident, different stakeholders have different roles and need-to-know:

| Stakeholder | Role in Incident | Information They Need |
|---|---|---|
| **CISO / Security Leadership** | Decision authority, escalation point | Full technical picture + business impact |
| **Legal Counsel** | Privilege, regulatory guidance, breach notification | Evidence details, timeline, exposure scope |
| **Executive Leadership / CEO** | Resource authorization, board communication | Business impact, financial exposure, PR risk |
| **IT Operations** | Technical remediation execution | Affected systems, remediation steps |
| **HR** | Insider threat cases, employee actions | Evidence specific to personnel matters |
| **PR / Communications** | External messaging, customer notification | Approved facts only; no speculation |
| **Privacy Officer** | PII/PHI exposure assessment, regulatory notification | Data types affected, subject count |
| **Business Unit Owners** | Operations impact, recovery prioritization | Which systems affect their operations |

**Need-to-know principle:** Only share incident details with stakeholders who need them for their role. Over-sharing creates legal risk, potential tipping-off in insider threat cases, and breach of confidentiality.

## Secure Reporting Channels

An incident investigation must not be communicated over channels that may be compromised.

- **Out-of-band communications** — if corporate email/Slack may be monitored by attacker, use personal email, phone, or a separate secure messaging platform
- **Attorney-client privilege** — legal counsel should be involved early; communications routed through counsel may be privileged and protected from discovery
- **Classified / restricted distribution** — use TLP markings (TLP:RED for most sensitive findings)
- **Physical security of reports** — don't email sensitive forensic findings; use encrypted file transfer, or hand-deliver in physical investigations
- **Report storage** — store completed investigation reports in access-controlled repositories; not in shared drives

## Metrics and KPIs for Security Reports

Regular reporting to leadership should include measurable program health metrics:

| Metric | Description |
|---|---|
| **MTTD** | Mean Time to Detect — avg time from compromise to detection |
| **MTTR** | Mean Time to Respond / Remediate |
| **Alert volume + false positive rate** | Program efficiency indicator |
| **Vulnerability SLA compliance** | % of findings remediated within defined SLA |
| **Patch coverage** | % of assets current; by severity tier |
| **Open critical findings** | Count of critical/high unresolved findings with age |
| **Incidents by type** | Trending over time; shows program improvement or decline |

## Key Exam Concepts

- **Executive summary** leads with business impact, not technical detail
- **Legal counsel** involvement early enables attorney-client privilege protection
- **Likelihood × impact** = risk; never present CVSS alone to executives
- **Need-to-know** — segment information by stakeholder role; HR gets HR-relevant facts
- Out-of-band communications are critical when corporate channels may be compromised
- **TLP markings** apply to reports, not just threat intel feeds
- Remediation recommendations must be **specific, assigned, and dated** — not generic advice
