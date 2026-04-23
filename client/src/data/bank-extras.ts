import type { MCQ } from "@/lib/types";

/* Additional questions spread across domains — filler for exam variety. */

export const EXTRAS: MCQ[] = [
  {
    id: "SO-021",
    kind: "mcq",
    domain: "1.0",
    objective: "1.2 Web logs — attack recognition",
    difficulty: 2,
    qualifier: "MOST",
    stem:
      "A web-server access log contains many requests to /admin/index.php?id=1' OR '1'='1. Which of the following is MOST likely being attempted?",
    artifact: {
      type: "log",
      title: "Web access log (nginx)",
      content: `203.0.113.8 - - [22/Apr/2026:09:02:14 +0000] "GET /admin/index.php?id=1%27%20OR%20%271%27=%271 HTTP/1.1" 200 4120
203.0.113.8 - - [22/Apr/2026:09:02:15 +0000] "GET /admin/index.php?id=1%27%20UNION%20SELECT%201,2,3-- HTTP/1.1" 200 2010
203.0.113.8 - - [22/Apr/2026:09:02:16 +0000] "GET /admin/index.php?id=1%27%20AND%20SLEEP(5)-- HTTP/1.1" 200 410`,
    },
    choices: [
      { id: "A", text: "Reflected XSS.", rationale: "No script payloads here; payloads target SQL syntax.", trap: "right-tool-wrong-purpose" },
      { id: "B", text: "SQL injection.", rationale: "Correct. Classic tautology + UNION + time-based probe.", trap: "correct" },
      { id: "C", text: "Path traversal.", rationale: "Would use ../ sequences, not SQL operators.", trap: "right-tool-wrong-purpose" },
      { id: "D", text: "SSRF.", rationale: "SSRF targets server-to-server URLs, not query parameters.", trap: "right-tool-wrong-purpose" },
    ],
    correct: ["B"],
    explanation: "The tautology + UNION SELECT + SLEEP() trio is SQL injection 101.",
    keyPhrase: "' OR '1'='1 = SQLi",
    notes: ["Network-Security-Monitoring", "Vulnerability-Management"],
  },
  {
    id: "SO-022",
    kind: "mcq",
    domain: "1.0",
    objective: "1.2 Authentication — MFA bypass",
    difficulty: 3,
    qualifier: "MOST",
    stem:
      "A user reports repeated MFA push notifications at 2 AM that they did not initiate. Which of the following is MOST likely occurring?",
    choices: [
      { id: "A", text: "MFA fatigue / push bombing.", rationale: "Correct. The attacker has valid credentials and is spamming pushes hoping for accidental approval.", trap: "correct" },
      { id: "B", text: "A time-sync problem on the user's device.", rationale: "Wouldn't cause external prompts.", trap: "right-tool-wrong-purpose" },
      { id: "C", text: "An out-of-date mobile app.", rationale: "Wouldn't produce unsolicited prompts.", trap: "scope-mismatch" },
      { id: "D", text: "A legitimate administrator testing.", rationale: "Tests use accounts under control, not unexpected 2 AM pushes.", trap: "valid-but-not-best" },
    ],
    correct: ["A"],
    explanation: "MFA fatigue means the password is already known. Temporarily disable the account, rotate, and enable number-matching MFA.",
    keyPhrase: "unsolicited pushes = credentials stolen",
    notes: ["Endpoint-Security-and-EDR", "Incident-Response-Lifecycle"],
  },
  {
    id: "VM-019",
    kind: "mcq",
    domain: "2.0",
    objective: "2.6 Default credentials",
    difficulty: 1,
    qualifier: "BEST",
    stem:
      "A new IP camera appliance was deployed with default vendor credentials. Which of the following is the BEST hardening step?",
    choices: [
      { id: "A", text: "Change default credentials and disable unused services.", rationale: "Correct. Base hygiene.", trap: "correct" },
      { id: "B", text: "Place the camera on the corporate LAN with no segmentation.", rationale: "Opposite of hardening.", trap: "scope-mismatch" },
      { id: "C", text: "Publish the admin interface to the internet for convenience.", rationale: "Makes the problem worse.", trap: "policy-vs-ops" },
      { id: "D", text: "Nothing — cameras are low risk.", rationale: "Cameras are frequently pivot points in real incidents.", trap: "scope-mismatch" },
    ],
    correct: ["A"],
    explanation: "Defaults + network-reachable admin interfaces are classic entry points. Change, segment, patch.",
    keyPhrase: "no defaults",
    notes: ["Vulnerability-Management"],
  },
  {
    id: "VM-020",
    kind: "mcq",
    domain: "2.0",
    objective: "2.1 Agent vs agentless",
    difficulty: 2,
    qualifier: "BEST",
    stem:
      "Which of the following scenarios is the BEST fit for agent-based vulnerability scanning over network-based?",
    choices: [
      { id: "A", text: "Roaming laptops that are often off the corporate network.", rationale: "Correct. Agents report posture regardless of location.", trap: "correct" },
      { id: "B", text: "ICS devices in a segmented OT zone.", rationale: "Passive monitoring suits OT; installing agents is usually not allowed.", trap: "scope-mismatch" },
      { id: "C", text: "Network printers without OS access.", rationale: "Agents won't install there.", trap: "right-tool-wrong-purpose" },
      { id: "D", text: "Third-party managed SaaS.", rationale: "Out of your management plane.", trap: "scope-mismatch" },
    ],
    correct: ["A"],
    explanation: "Agents shine for roaming endpoints. Network scanners shine for headless infrastructure.",
    keyPhrase: "roaming = agent",
    notes: ["Vulnerability-Management"],
  },
  {
    id: "IR-013",
    kind: "mcq",
    domain: "3.0",
    objective: "3.2 Ransomware containment — select three",
    difficulty: 3,
    qualifier: "THREE",
    stem:
      "During a confirmed ransomware outbreak, which THREE of the following should be taken as immediate containment actions?",
    choices: [
      { id: "A", text: "Isolate affected network segments and endpoints.", rationale: "Stops spread.", trap: "correct" },
      { id: "B", text: "Disable compromised credentials and service accounts used by the attacker.", rationale: "Removes the attacker's active access.", trap: "correct" },
      { id: "C", text: "Block known C2 destinations at the egress proxy and firewall.", rationale: "Cuts command-and-control and exfil.", trap: "correct" },
      { id: "D", text: "Pay the ransom.", rationale: "Not a containment step; often discouraged.", trap: "policy-vs-ops" },
      { id: "E", text: "Publish the encryption keys on social media.", rationale: "Nonsensical and not available to defenders.", trap: "scope-mismatch" },
    ],
    correct: ["A", "B", "C"],
    explanation: "Containment for ransomware: stop spread (isolation), kill attacker access (credentials), cut outbound paths (C2/exfil).",
    keyPhrase: "isolate, kill creds, cut C2",
    notes: ["Incident-Response-Lifecycle"],
  },
  {
    id: "IR-014",
    kind: "mcq",
    domain: "3.0",
    objective: "3.4 IOC extraction",
    difficulty: 2,
    qualifier: "MOST",
    stem:
      "After sandbox analysis of a malware sample, which of the following extracted data points is MOST valuable to operationalize immediately?",
    choices: [
      { id: "A", text: "The color of the sandbox UI.", rationale: "Not data.", trap: "scope-mismatch" },
      { id: "B", text: "The file's embedded copyright string.", rationale: "Low value for detection.", trap: "valid-but-not-best" },
      { id: "C", text: "The C2 domains/IPs, persistence artifacts, and file hashes.", rationale: "Correct. These drive IDS blocks, SIEM queries, and endpoint scans.", trap: "correct" },
      { id: "D", text: "The filename chosen by the analyst.", rationale: "Not an IOC.", trap: "scope-mismatch" },
    ],
    correct: ["C"],
    explanation: "Operational IOCs: network (domains/IPs), host (hashes/paths/registry), behavior (processes/commands).",
    keyPhrase: "network + host + behavior",
    notes: ["Digital-Forensics-and-Malware-Analysis"],
  },
  {
    id: "RC-011",
    kind: "mcq",
    domain: "4.0",
    objective: "4.1 Dashboards",
    difficulty: 1,
    qualifier: "BEST",
    stem:
      "Which of the following is the BEST dashboard widget for a SOC manager to see whether detection engineering is improving?",
    choices: [
      { id: "A", text: "Number of CVEs published this month.", rationale: "External, not a SOC metric.", trap: "scope-mismatch" },
      { id: "B", text: "Trend of true-positive rate and MTTD over 90 days.", rationale: "Correct. Shows signal quality and speed improving (or not).", trap: "correct" },
      { id: "C", text: "Sum of all SIEM log volume.", rationale: "Volume ≠ quality.", trap: "valid-but-not-best" },
      { id: "D", text: "Total number of users.", rationale: "Not related to detection quality.", trap: "scope-mismatch" },
    ],
    correct: ["B"],
    explanation: "Track trends in quality + speed. Volume alone doesn't tell you anything about effectiveness.",
    keyPhrase: "TPR + MTTD over time",
    notes: ["Reporting-and-Communication"],
  },
];
