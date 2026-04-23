import type { PBQ } from "@/lib/types";

/* ==========================================================================
   Performance-Based Questions (PBQs)
   Each PBQ contains an artifact (logs, alerts, vulns, etc.) and structured
   tasks that the UI will render as a split-view workspace.
   ========================================================================== */

export const PBQS: PBQ[] = [
  /* ------------------------------------------------------------------
     PBQ-1 — Log Analysis
     Mixed logs from firewall, DNS, EDR, authentication
     ------------------------------------------------------------------ */
  {
    id: "PBQ-1",
    kind: "pbq",
    pbqKind: "log-analysis",
    domain: "1.0",
    objective: "1.2 Multi-source log correlation",
    difficulty: 2,
    title: "Mixed-log triage on the finance segment",
    scenario:
      "You are the on-shift analyst. Multiple low-severity alerts fired on the finance subnet in the last hour. You've pulled the most relevant entries from four log sources. Triage the incident.",
    artifacts: [
      {
        type: "log",
        title: "EDR — process events (FIN-WS-12)",
        content: `10:03:02  winword.exe (PID 4120) -> powershell.exe (PID 4188)  cmd="powershell -w hidden -enc SQBFAFgA..."
10:03:04  powershell.exe (PID 4188) -> cmd.exe (PID 4220)       cmd="cmd /c whoami /all & net group \\"Domain Admins\\" /domain"
10:03:07  powershell.exe (PID 4188) -> rundll32.exe (PID 4240)  cmd="rundll32 C:\\Users\\Public\\sq.dll,Init"
10:03:12  rundll32.exe (PID 4240) -> conhost.exe                spawned child`,
      },
      {
        type: "log",
        title: "DNS resolver",
        content: `10:03:08  FIN-WS-12   A?   cdn-static-proxy.net      -> 45.77.212.14
10:03:09  FIN-WS-12   A?   cdn-static-proxy.net      -> 45.77.212.14  (cached)
10:03:70  FIN-WS-12   A?   a7f3.b921.metrics-api.biz -> NXDOMAIN
10:03:82  FIN-WS-12   A?   c1a4.b921.metrics-api.biz -> NXDOMAIN
10:03:95  FIN-WS-12   A?   d32f.b921.metrics-api.biz -> NXDOMAIN`,
      },
      {
        type: "log",
        title: "Perimeter firewall",
        content: `10:03:09  ALLOW  FIN-WS-12:51234  ->  45.77.212.14:443   tcp  (HTTPS)
10:03:68  ALLOW  FIN-WS-12:51292  ->  45.77.212.14:443   tcp  (HTTPS)   90s beacon
10:04:38  ALLOW  FIN-WS-12:51345  ->  45.77.212.14:443   tcp  (HTTPS)`,
      },
      {
        type: "log",
        title: "Windows Security — authentication",
        content: `10:04:02  4624  FIN-WS-12   sv-back-up   Type 3 (NTLM)   SRC: FIN-WS-12
10:04:05  4624  FIN-DB-04   sv-back-up   Type 3 (NTLM)   SRC: FIN-WS-12
10:04:07  4624  FIN-DB-04   sv-back-up   Type 10 (RDP)   SRC: FIN-WS-12`,
      },
    ],
    tasks: [
      {
        id: "PBQ-1.T1",
        prompt:
          "Which host is MOST likely the initial point of compromise, and what was the likely initial access technique?",
        qualifier: "MOST",
        mode: "single",
        choices: [
          { id: "A", text: "FIN-DB-04, via RDP brute force.", rationale: "DB-04 is a later pivot; no failed logons and the auth came from FIN-WS-12.", trap: "right-action-wrong-phase" },
          { id: "B", text: "FIN-WS-12, via macro / maldoc (Office → encoded PowerShell).", rationale: "Correct. winword.exe is the root of the process tree, followed by encoded PowerShell.", trap: "correct" },
          { id: "C", text: "The DNS resolver, via cache poisoning.", rationale: "No cache-poisoning evidence; the DNS queries come from the workstation.", trap: "right-tool-wrong-purpose" },
          { id: "D", text: "The firewall, via a DoS.", rationale: "Firewall shows allowed traffic, not being attacked.", trap: "scope-mismatch" },
        ],
        correct: ["B"],
        explanation: "Process tree rooted at winword.exe with an encoded PowerShell child is the canonical maldoc chain.",
      },
      {
        id: "PBQ-1.T2",
        prompt: "Which THREE indicators in the logs are MOST strongly consistent with C2 and lateral movement already underway?",
        qualifier: "THREE",
        mode: "multi",
        choices: [
          { id: "A", text: "Regular 90-second HTTPS beacons from FIN-WS-12 to 45.77.212.14.", rationale: "Low-and-slow beacon cadence.", trap: "correct" },
          { id: "B", text: "Random subdomain DNS queries to metrics-api.biz (DNS tunneling pattern).", rationale: "Random subdomains, single zone.", trap: "correct" },
          { id: "C", text: "NTLM Type 3 logons from FIN-WS-12 to FIN-DB-04 using a service account.", rationale: "Service account crossing subnets via NTLM = likely Pass-the-Hash.", trap: "correct" },
          { id: "D", text: "Notepad.exe spawning chrome.exe.", rationale: "Not present in the artifacts.", trap: "scope-mismatch" },
          { id: "E", text: "The firewall blocking inbound SMB.", rationale: "Not shown in the logs, and inbound block is benign.", trap: "scope-mismatch" },
        ],
        correct: ["A", "B", "C"],
        explanation: "C2 = beacons and tunneling. Lateral movement = unexpected NTLM / RDP with service account.",
      },
      {
        id: "PBQ-1.T3",
        prompt: "Which of the following should the analyst do FIRST?",
        qualifier: "FIRST",
        mode: "single",
        choices: [
          { id: "A", text: "Reimage FIN-WS-12 immediately.", rationale: "Destroys volatile evidence before memory capture.", trap: "right-action-wrong-phase" },
          { id: "B", text: "Network-isolate FIN-WS-12 (and FIN-DB-04) while keeping them powered on.", rationale: "Correct. Stops C2 and lateral spread, preserves RAM for forensics.", trap: "correct" },
          { id: "C", text: "Open a Sev-2 ticket and wait for business hours.", rationale: "Active incident; wait is wrong.", trap: "scope-mismatch" },
          { id: "D", text: "Block 45.77.212.14 at the firewall only.", rationale: "Doesn't stop the compromised account on other hosts.", trap: "valid-but-not-best" },
        ],
        correct: ["B"],
        explanation: "Isolate + preserve is the FIRST play. Blocks and forensics follow.",
      },
    ],
    explanation: "This exercise is about stitching together EDR, DNS, firewall, and authentication to tell one story: maldoc → PowerShell → C2 beacon + DNS tunneling → NTLM pivot with service account.",
    notes: ["SIEM-and-Log-Analysis", "Endpoint-Security-and-EDR", "Network-Security-Monitoring"],
  },

  /* ------------------------------------------------------------------
     PBQ-2 — SIEM Triage
     ------------------------------------------------------------------ */
  {
    id: "PBQ-2",
    kind: "pbq",
    pbqKind: "siem-triage",
    domain: "1.0",
    objective: "1.4 SIEM alert triage",
    difficulty: 1,
    title: "Morning triage queue",
    scenario: "You are starting your shift. The SIEM has produced the following alerts since 06:00. Triage them.",
    artifacts: [
      {
        type: "alerts",
        title: "SIEM alerts — last 3 hours",
        alerts: [
          { id: "A-1", severity: "High", source: "EDR", rule: "Office child process PowerShell (encoded)", count: 1, host: "HR-WS-07" },
          { id: "A-2", severity: "Low", source: "Proxy", rule: "Allowed outbound to cloud-storage domain", count: 412, host: "*" },
          { id: "A-3", severity: "Medium", source: "IDS", rule: "Outbound SSH to non-corporate IP", count: 3, host: "DEV-JUMP-01" },
          { id: "A-4", severity: "High", source: "AD", rule: "4625 failures across >40 accounts from single host", count: 260, host: "KIOSK-11" },
          { id: "A-5", severity: "Info", source: "DNS", rule: "Resolved well-known analytics domain", count: 9120, host: "*" },
          { id: "A-6", severity: "Medium", source: "EDR", rule: "New scheduled task (user context)", count: 1, host: "FIN-WS-03" },
        ],
      },
    ],
    tasks: [
      {
        id: "PBQ-2.T1",
        prompt: "Which TWO alerts should be escalated immediately as likely true positives?",
        qualifier: "TWO",
        mode: "multi",
        choices: [
          { id: "A", text: "A-1 — Office spawning encoded PowerShell.", rationale: "High-fidelity signal of maldoc execution.", trap: "correct" },
          { id: "B", text: "A-4 — 4625 burst across many accounts from a single host.", rationale: "Password spraying from inside the network.", trap: "correct" },
          { id: "C", text: "A-2 — Generic cloud-storage egress.", rationale: "Very noisy, often benign without context.", trap: "valid-but-not-best" },
          { id: "D", text: "A-5 — Analytics domain DNS.", rationale: "Info-level benign.", trap: "scope-mismatch" },
        ],
        correct: ["A", "B"],
        explanation: "Maldoc execution and outbound spraying pattern are both urgent. Broad cloud-egress and analytics domains are normal.",
      },
      {
        id: "PBQ-2.T2",
        prompt: "For alert A-6 (new scheduled task in user context on FIN-WS-03), which of the following is the BEST NEXT investigative step?",
        qualifier: "NEXT",
        mode: "single",
        choices: [
          { id: "A", text: "Mark it as a false positive and close.", rationale: "Too soon — user-context scheduled tasks are a persistence signal worth verifying.", trap: "right-action-wrong-phase" },
          { id: "B", text: "Inspect the task's target binary, command line, trigger, and author; query EDR for the creating process.", rationale: "Correct. Context determines whether the task is persistence.", trap: "correct" },
          { id: "C", text: "Disable all scheduled tasks on the host.", rationale: "Breaks legitimate tasks.", trap: "scope-mismatch" },
          { id: "D", text: "Immediately reimage.", rationale: "Skips validation.", trap: "right-action-wrong-phase" },
        ],
        correct: ["B"],
        explanation: "Investigate the task's provenance and payload before acting.",
      },
    ],
    explanation: "Triage means ranking by fidelity × impact, not severity label alone. Don't let volume hide the dangerous ones.",
    notes: ["SIEM-and-Log-Analysis"],
  },

  /* ------------------------------------------------------------------
     PBQ-3 — Vulnerability Prioritization
     ------------------------------------------------------------------ */
  {
    id: "PBQ-3",
    kind: "pbq",
    pbqKind: "vuln-prioritize",
    domain: "2.0",
    objective: "2.4 Prioritization",
    difficulty: 2,
    title: "Quarterly scan results — prioritize",
    scenario: "The scanner has returned these findings. You have capacity to remediate two this week. Prioritize.",
    artifacts: [
      {
        type: "vulns",
        title: "Scan results — high-level",
        findings: [
          { host: "DMZ-WEB-01", service: "nginx 1.18 (internet-facing)", cve: "CVE-2025-9981", cvss: 9.8, exploitInWild: true, kev: true, epss: 0.94, note: "Unauthenticated RCE" },
          { host: "INT-DB-22", service: "PostgreSQL (internal)", cve: "CVE-2025-7712", cvss: 8.8, exploitInWild: false, kev: false, epss: 0.04, note: "Auth'd SQL injection" },
          { host: "AIRGAP-LAB-05", service: "Legacy SCADA HMI", cve: "CVE-2019-12345", cvss: 9.1, exploitInWild: false, kev: false, epss: 0.01, note: "No network reachability" },
          { host: "COR-FS-03", service: "SMB (internal file share)", cve: "CVE-2024-31001", cvss: 7.5, exploitInWild: true, kev: true, epss: 0.82, note: "Authenticated RCE for any domain user" },
        ],
      },
    ],
    tasks: [
      {
        id: "PBQ-3.T1",
        prompt: "Which TWO findings should be remediated FIRST this week?",
        qualifier: "TWO",
        mode: "multi",
        choices: [
          { id: "A", text: "DMZ-WEB-01 nginx RCE (CVSS 9.8, KEV, EPSS 0.94).", rationale: "Internet-facing + actively exploited = top of the list.", trap: "correct" },
          { id: "B", text: "COR-FS-03 SMB RCE (CVSS 7.5, KEV, EPSS 0.82).", rationale: "Lower CVSS but widely exploited and any domain user can reach it.", trap: "correct" },
          { id: "C", text: "AIRGAP-LAB-05 SCADA HMI (CVSS 9.1).", rationale: "Environmental context — no reachability — lowers priority.", trap: "valid-but-not-best" },
          { id: "D", text: "INT-DB-22 PostgreSQL authd SQLi.", rationale: "Requires DB auth and not exploited in the wild.", trap: "valid-but-not-best" },
        ],
        correct: ["A", "B"],
        explanation: "Both top picks combine severity with real-world exploitation. Air-gapped CVSS 9.1 loses to exploited 7.5 when context is applied.",
      },
      {
        id: "PBQ-3.T2",
        prompt: "Which of the following is the BEST justification for deprioritizing AIRGAP-LAB-05 despite its CVSS 9.1?",
        qualifier: "BEST",
        mode: "single",
        choices: [
          { id: "A", text: "Air-gapping is a compensating control and EPSS/KEV indicate no active exploitation.", rationale: "Correct. Environmental context + no exploitation evidence.", trap: "correct" },
          { id: "B", text: "SCADA vendors don't release patches.", rationale: "Generalization and irrelevant to priority.", trap: "policy-vs-ops" },
          { id: "C", text: "The CVE is old, so it doesn't matter.", rationale: "Age alone isn't justification.", trap: "valid-but-not-best" },
          { id: "D", text: "The asset is in the lab, so it's out of scope.", rationale: "Scoping this way would miss real risk in labs.", trap: "scope-mismatch" },
        ],
        correct: ["A"],
        explanation: "Risk-based prioritization weighs severity, exploitation, and environmental context.",
      },
    ],
    explanation: "Mature VM combines CVSS + KEV + EPSS + business context. Raw CVSS alone is rarely enough.",
    notes: ["Vulnerability-Management", "CVSS-v3.1-Guide"],
  },

  /* ------------------------------------------------------------------
     PBQ-4 — PCAP / Flow Summary
     ------------------------------------------------------------------ */
  {
    id: "PBQ-4",
    kind: "pbq",
    pbqKind: "pcap-summary",
    domain: "1.0",
    objective: "1.2 Network flow analysis",
    difficulty: 2,
    title: "Flow summary — which hosts are suspicious?",
    scenario: "A summarized NetFlow view over the last hour. Identify any host likely exfiltrating data or beaconing.",
    artifacts: [
      {
        type: "table",
        title: "Flows (aggregated)",
        columns: ["Host", "Dst", "Port", "Cadence", "Bytes sent", "Bytes rcvd", "Duration"],
        rows: [
          ["ENG-WS-01", "198.51.100.22", "443", "irregular", "140 MB", "3 MB", "42 min"],
          ["MKT-WS-04", "45.77.212.14", "443", "every 60s ±2s", "48 KB", "12 KB", "58 min"],
          ["HR-WS-10", "cdn-updates.microsoft.com", "443", "bursty", "18 MB", "6 MB", "9 min"],
          ["DEV-BLD-02", "registry.internal", "443", "bursty", "220 MB", "12 MB", "14 min"],
          ["FIN-WS-12", "45.77.212.14", "443", "every 60s ±2s", "52 KB", "14 KB", "58 min"],
        ],
      },
    ],
    tasks: [
      {
        id: "PBQ-4.T1",
        prompt: "Which TWO hosts show the clearest C2 beaconing pattern?",
        qualifier: "TWO",
        mode: "multi",
        choices: [
          { id: "A", text: "MKT-WS-04 (60s ±2s to 45.77.212.14, small payload).", rationale: "Classic beacon signature.", trap: "correct" },
          { id: "B", text: "FIN-WS-12 (60s ±2s to 45.77.212.14, small payload).", rationale: "Same destination and cadence — part of the same campaign.", trap: "correct" },
          { id: "C", text: "ENG-WS-01 (140 MB sent).", rationale: "Looks like exfil but cadence is irregular, not beacon-shaped.", trap: "valid-but-not-best" },
          { id: "D", text: "HR-WS-10 (Microsoft CDN).", rationale: "Legitimate update destination.", trap: "scope-mismatch" },
        ],
        correct: ["A", "B"],
        explanation: "Two hosts hitting the same external IP on a steady cadence is the clearest beaconing picture in this view.",
      },
      {
        id: "PBQ-4.T2",
        prompt: "Which of the following is the MOST likely explanation for ENG-WS-01's 140 MB outbound to 198.51.100.22?",
        qualifier: "MOST",
        mode: "single",
        choices: [
          { id: "A", text: "Data exfiltration of a large file set.", rationale: "Correct. High outbound volume to an external IP with small inbound is the exfil shape.", trap: "correct" },
          { id: "B", text: "A vendor pushing a firmware update.", rationale: "That would be inbound-heavy, not outbound-heavy.", trap: "right-action-wrong-phase" },
          { id: "C", text: "A developer testing a load-balancer.", rationale: "Possible but without context, exfil is the most suspicious reading.", trap: "valid-but-not-best" },
          { id: "D", text: "A streaming media session.", rationale: "Streaming is inbound-heavy.", trap: "scope-mismatch" },
        ],
        correct: ["A"],
        explanation: "Ratio matters: outbound >> inbound to a single external destination over a long session suggests exfil.",
      },
    ],
    explanation: "Beaconing = cadence + small payload. Exfil = lopsided byte counts. Use both shapes to triage flows.",
    notes: ["Network-Security-Monitoring"],
  },

  /* ------------------------------------------------------------------
     PBQ-5 — IR Sequence (PICERL)
     ------------------------------------------------------------------ */
  {
    id: "PBQ-5",
    kind: "pbq",
    pbqKind: "ir-sequence",
    domain: "3.0",
    objective: "3.1 PICERL sequencing",
    difficulty: 2,
    title: "Order the response steps",
    scenario: "A malware infection has been confirmed on a corporate workstation. Arrange the actions below into the correct PICERL order, starting with Identification and ending with Lessons Learned.",
    artifacts: [
      {
        type: "notes",
        title: "Actions (shuffled)",
        content: `• A) Rebuild the workstation from a known-good image and return it to production.
• B) Capture RAM, then take a forensic disk image of the workstation.
• C) Review the incident, update playbooks, and schedule training on maldoc handling.
• D) SIEM correlates EDR + proxy alerts and a Tier-2 analyst confirms a true positive.
• E) Remove persistence mechanisms, kill malicious processes, rotate affected credentials.
• F) Network-isolate the workstation while keeping it powered on.`,
      },
    ],
    tasks: [
      {
        id: "PBQ-5.T1",
        prompt:
          "Place the actions in the correct PICERL order (Identification → Containment → Evidence collection → Eradication → Recovery → Lessons Learned).",
        qualifier: "BEST",
        mode: "order",
        choices: [
          { id: "D", text: "SIEM correlates EDR + proxy alerts and a Tier-2 analyst confirms a true positive.", rationale: "Identification.", trap: "correct" },
          { id: "F", text: "Network-isolate the workstation while keeping it powered on.", rationale: "Containment.", trap: "correct" },
          { id: "B", text: "Capture RAM, then take a forensic disk image of the workstation.", rationale: "Evidence — done while host is isolated but still running.", trap: "correct" },
          { id: "E", text: "Remove persistence mechanisms, kill malicious processes, rotate affected credentials.", rationale: "Eradication.", trap: "correct" },
          { id: "A", text: "Rebuild the workstation from a known-good image and return it to production.", rationale: "Recovery.", trap: "correct" },
          { id: "C", text: "Review the incident, update playbooks, and schedule training on maldoc handling.", rationale: "Lessons Learned.", trap: "correct" },
        ],
        correct: ["D", "F", "B", "E", "A", "C"],
        explanation: "PICERL sequence with evidence collection bridging Containment and Eradication so volatile state is preserved.",
      },
    ],
    explanation: "The canonical order is Preparation → Identification → Containment → Eradication → Recovery → Lessons Learned. Evidence capture fits between Containment and Eradication because you isolate first to stop spread, capture before you destroy.",
    notes: ["Incident-Response-Lifecycle", "Digital-Forensics-and-Malware-Analysis"],
  },

  /* ------------------------------------------------------------------
     PBQ-6 — Reporting
     ------------------------------------------------------------------ */
  {
    id: "PBQ-6",
    kind: "pbq",
    pbqKind: "reporting",
    domain: "4.0",
    objective: "4.2 Executive summary authoring",
    difficulty: 2,
    title: "Draft the executive summary",
    scenario:
      "You have finished responding to a phishing-driven ransomware attempt on a single workstation. Containment was immediate, no data left the network, no production disruption. You have been asked to deliver a 4-bullet executive summary for the board.",
    artifacts: [
      {
        type: "notes",
        title: "Raw SOC notes (condensed transcript)",
        content: `09:42  T1 opens ticket: EDR alert, winword -> encoded PowerShell on HR-WS-07.
09:45  T2 confirms maldoc, isolates host.
09:51  RAM captured, disk imaged.
10:04  Malicious Run key + scheduled task found; creds for local admin rotated.
10:32  Host rebuilt from golden image; returned to user.
11:10  All SIEM rules re-scanned for similar IOCs; no other hosts affected.
11:40  Draft report to CISO. No data exfiltration observed in egress logs.`,
      },
    ],
    tasks: [
      {
        id: "PBQ-6.T1",
        prompt: "Select the FOUR bullets MOST appropriate for an executive summary.",
        qualifier: "MOST",
        mode: "multi",
        choices: [
          { id: "A", text: "What happened: a phishing attachment on one HR workstation attempted to deploy ransomware.", rationale: "Plain-English event summary.", trap: "correct" },
          { id: "B", text: "Impact: contained in under 10 minutes; no data exfiltration; no production disruption.", rationale: "Business-meaningful impact.", trap: "correct" },
          { id: "C", text: "Response: isolation, forensic capture, credential rotation, and rebuild from known-good image.", rationale: "Action-oriented summary.", trap: "correct" },
          { id: "D", text: "Next steps: expand phishing awareness training and add macro-blocking policy to Office.", rationale: "Forward-looking with owners.", trap: "correct" },
          { id: "E", text: "Full paste of the 47 IOCs captured during incident.", rationale: "Belongs in the technical appendix.", trap: "scope-mismatch" },
          { id: "F", text: "SIEM rule IDs and regex.", rationale: "Not board-level.", trap: "right-tool-wrong-purpose" },
          { id: "G", text: "Personal opinion on which employee was 'at fault'.", rationale: "Blame culture — not appropriate.", trap: "policy-vs-ops" },
        ],
        correct: ["A", "B", "C", "D"],
        explanation: "Executive summaries: what happened, impact, what you did, what's next. In business language.",
      },
    ],
    explanation: "This PBQ rewards restraint. Four bullets, no jargon, clear business framing.",
    notes: ["Reporting-and-Communication"],
  },
];
