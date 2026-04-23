# Threat Intelligence and Hunting

## Overview — CS0-003 Domain 1

**Threat intelligence** is analyzed information about adversaries — their capabilities, infrastructure, motives, and tactics — used to make faster, better-informed defensive decisions. **Threat hunting** is the proactive, hypothesis-driven search for adversary activity that has evaded automated detection. CySA+ expects you to distinguish intel types, use structured frameworks, and operationalize hunts.

## IOCs vs IOAs

| Type | Definition | Examples | Durability |
|---|---|---|---|
| **IOC** (Indicator of Compromise) | Artifact left by an attack | File hash, IP, domain, registry key | Low — trivial for attacker to change |
| **IOA** (Indicator of Attack) | Behavioral pattern indicating intent | Encoded command execution, LSASS access, lateral movement sequence | High — reflects TTPs, harder to change |

**Key point for exam:** IOCs are reactive and short-lived. IOAs map to TTPs higher on the Pyramid of Pain and provide durable detection value.

## Pyramid of Pain

The **Pyramid of Pain** (David Bianco) illustrates how difficult it is for an adversary to change each indicator type if you detect and block it.

```
        /\
       /  \   TTPs — hardest to change; most valuable
      /----\
     / Tools \
    /----------\
   / Network Artefacts \
  /----------------------\
 /    Host Artefacts       \
/----------------------------\
/       Domain Names          \
/--------------------------------\
/          IP Addresses            \
/------------------------------------\
/        Hash Values (trivial)         \
```

- **Hashes** — rotate with every recompile; block them but don't rely on them
- **IPs/Domains** — fast-flux, bulletproof hosting trivialize rotation
- **Network/Host Artefacts** — mutex names, URI patterns, registry paths; useful but changeable
- **Tools** — specific malware families, frameworks (Cobalt Strike, Metasploit); changing tools is costly
- **TTPs** — how the adversary operates; mapped to MITRE ATT&CK; disrupting these forces fundamental behavioral change

## Threat Intelligence Lifecycle

1. **Planning & Direction** — define intelligence requirements (PIRs): what does the organization need to know?
2. **Collection** — gather raw data from feeds, dark web, ISACs, honeypots, open-source
3. **Processing** — normalize, translate, filter noise from raw data
4. **Analysis** — apply analytical tradecraft; produce finished intelligence
5. **Dissemination** — share with appropriate consumers (SOC gets tactical IOCs, CISO gets strategic briefings)
6. **Feedback** — consumers report whether intel was actionable; drives next planning cycle

### Intel Tiers

| Tier | Audience | Content |
|---|---|---|
| **Strategic** | Executives, board | Nation-state activity, threat landscape trends |
| **Operational** | IR teams, threat hunters | Campaign details, adversary infrastructure |
| **Tactical** | SOC analysts, SIEM engineers | IOCs: hashes, IPs, domains, YARA/Snort rules |

## STIX and TAXII

**STIX (Structured Threat Information eXpression)** — JSON-based language for representing threat intel objects: Indicators, Threat Actors, Attack Patterns, Campaigns, Malware, Relationships.

**TAXII (Trusted Automated eXchange of Intelligence Information)** — transport protocol for sharing STIX content over HTTPS. Two models:
- **Collections** — request/response (client pulls intel on demand)
- **Channels** — publish/subscribe (push model)

**ISACs (Information Sharing and Analysis Centers)** — sector-specific threat sharing organizations (FS-ISAC for finance, H-ISAC for healthcare, etc.). Membership provides early warning of sector-targeted campaigns.

## Threat Intel Feeds

| Feed Type | Examples | Use |
|---|---|---|
| Commercial | Recorded Future, CrowdStrike Intel, Mandiant | High-quality, curated, costly |
| Open source (OSINT) | AlienVault OTX, MISP, Abuse.ch, Feodo Tracker | Free, variable quality |
| Government | CISA AIS, FBI InfraGard, NSA advisories | Authoritative for critical threats |
| Internal | Prior incidents, honeypot logs | Highest relevance to your environment |

**TIP scoring — Traffic Light Protocol:**
- **TLP:RED** — named recipients only
- **TLP:AMBER** — organization and need-to-know partners only
- **TLP:GREEN** — community; not public
- **TLP:CLEAR** — unrestricted, publicly shareable

## MITRE ATT&CK-Driven Hunting

ATT&CK provides the vocabulary for structuring hunts. A well-formed hunt hypothesis cites a specific technique.

### Hunt Hypothesis Formula

```
"Based on [threat intel / anomaly / ATT&CK technique],
I believe [actor / malware] may be [TTP description]
on [asset scope], which would leave evidence in [data source]."
```

**Example:**
> "Based on the Lazarus Group profile, I believe threat actors may be using PowerShell with encoded commands (T1059.001) on finance workstations, which would leave evidence in Sysmon Event ID 1 and Windows PowerShell operational logs."

### Common Hunt Data Sources by Technique

| Technique | Data Source | Key Signal |
|---|---|---|
| T1059 — Command/Script Interpreter | Sysmon EID 1, PowerShell logs | Encoded commands, unusual parent |
| T1078 — Valid Accounts | 4624/4625, VPN logs | Off-hours logons, geo anomalies |
| T1003 — Credential Dumping | Sysmon EID 10, 4656 | LSASS access, procdump execution |
| T1071 — App Layer C2 | Proxy logs, DNS | High-frequency DNS, beaconing intervals |
| T1021 — Remote Services | 4624 Type 3, WMI logs | Admin shares, WMI subscriptions |
| T1055 — Process Injection | Sysmon EID 8/10 | Cross-process memory writes |

## Deception Technology

**Deception tech** deploys decoys (honeypots, honeytokens, honeyfiles) that have no legitimate business purpose — any interaction is high-confidence malicious activity.

- **Honeypot** — fake system that mimics real services; detects reconnaissance and exploitation attempts
- **Honeytoken** — fake credential, API key, or document embedded in the environment; alerts on use
- **Honeyfile** — decoy file with a beacon; fires when opened (even off-network via DNSBL callback)
- **Canary token** — lightweight URL/document that phones home on access (canarytokens.org-style)

**Exam note:** Deception tech produces **very low false positive rates** because legitimate users never interact with decoys. Any alert from a honeypot is high priority.

## Hunt Methodology

### Structured Hunt Workflow

1. **Trigger** — intel tip, anomaly from SIEM, new ATT&CK technique advisory
2. **Hypothesis** — specific, falsifiable statement about adversary behavior
3. **Data collection** — identify which logs support or refute the hypothesis
4. **Investigation** — search, query, pivot across data sources
5. **Finding** — either confirm/deny hypothesis, or discover unrelated anomaly
6. **Improvement** — if no detection rule existed for confirmed behavior, create one; feed back to SIEM

### Hunting Tools and Techniques

- **Frequency analysis** — identify rare processes, parent-child pairs, domains
- **Stack ranking** — sort all instances of a field (e.g., parent process name) by count; low-frequency outliers warrant investigation
- **Clustering** — group similar behaviors; outliers from the cluster are suspicious
- **Baseline comparison** — compare current activity to rolling 30-day average; statistically significant deviations surface anomalies

## Key Exam Concepts

- The **Pyramid of Pain** is foundational — know which indicator type sits where and why
- **STIX/TAXII** is the sharing standard; know the difference (STIX = format, TAXII = transport)
- **TLP markings** control dissemination; TLP:RED is most restrictive
- Threat hunting is **proactive** (you initiate) vs incident response which is **reactive** (alert triggers)
- ATT&CK Navigator heatmaps show coverage gaps — see MITRE-ATTCK-Reference for navigator usage
- Deception tech signals are **high confidence** — treat them as confirmed compromise until proven otherwise
