/* ==========================================================================
   CySA+ CS0-003 — Question Bank Types
   ==========================================================================
   The bank is keyed by domain + objective. The exam generator samples from
   the bank using weighted selection to match the official 33/30/20/17 split.
   ========================================================================== */

export type Domain = "1.0" | "2.0" | "3.0" | "4.0";

export const DOMAIN_META: Record<Domain, { name: string; weight: number; accent: string }> = {
  "1.0": { name: "Security Operations", weight: 0.33, accent: "chart-1" },
  "2.0": { name: "Vulnerability Management", weight: 0.30, accent: "chart-2" },
  "3.0": { name: "Incident Response & Management", weight: 0.20, accent: "chart-3" },
  "4.0": { name: "Reporting & Communication", weight: 0.17, accent: "chart-4" },
};

export type Difficulty = 1 | 2 | 3;

/** Qualifiers CompTIA uses that drive question logic. Visually emphasized. */
export type Qualifier = "FIRST" | "BEST" | "NEXT" | "MOST" | "LEAST" | "TWO" | "THREE";

/** One answer option in an MCQ / multi-select. */
export interface Choice {
  id: string;            // "A" | "B" | "C" | "D" | ...
  text: string;
  /** Explanation shown in review — why this is right, or why it's weaker. */
  rationale: string;
  /** Distractor pattern — helps the analytics engine spot systematic errors. */
  trap?:
    | "right-action-wrong-phase"
    | "right-tool-wrong-purpose"
    | "valid-but-not-best"
    | "scope-mismatch"
    | "policy-vs-ops"
    | "correct";
}

/** Core question card — shared by MCQ and the MCQ layer of a PBQ. */
export interface MCQ {
  id: string;                     // "SO-001", "VM-012", etc.
  kind: "mcq";
  domain: Domain;
  objective: string;              // free-text objective tag (e.g. "1.4 SIEM correlation")
  difficulty: Difficulty;
  qualifier?: Qualifier;
  stem: string;                   // the scenario + question
  /** Optional log/table/code block rendered above the choices. */
  artifact?: Artifact;
  choices: Choice[];
  correct: string[];              // choice ids — length 1 = MCQ, 2+ = multi-select
  explanation: string;            // overall teaching note
  /** Key word(s) the answer hinges on — shown in the review pane. */
  keyPhrase?: string;
  /** Cross-link to curriculum markdown slug. */
  notes?: string[];
}

/** An artifact is a rendered block of evidence: log, table, packet list, etc. */
export type Artifact =
  | { type: "log"; title: string; content: string }
  | { type: "table"; title: string; columns: string[]; rows: string[][] }
  | { type: "alerts"; title: string; alerts: Alert[] }
  | { type: "vulns"; title: string; findings: Finding[] }
  | { type: "flows"; title: string; content: string }
  | { type: "notes"; title: string; content: string };

export interface Alert {
  id: string;
  severity: "Critical" | "High" | "Medium" | "Low" | "Info";
  source: string;
  rule: string;
  count: number;
  host?: string;
}

export interface Finding {
  host: string;
  service: string;
  cve: string;
  cvss: number;
  vector?: string;
  exploitInWild?: boolean;
  kev?: boolean;
  epss?: number;        // 0-1
  note?: string;
}

/* ==========================================================================
   PBQs
   ========================================================================== */

export type PBQKind =
  | "log-analysis"       // mixed logs → identify host + attack + first action
  | "siem-triage"        // alert list → pick true positives + next step
  | "vuln-prioritize"    // rank findings by remediation priority
  | "pcap-summary"       // flows → spot beaconing / exfil
  | "ir-sequence"        // order cards into PICERL sequence
  | "reporting";         // select exec-summary bullets from notes

/** A PBQ contains one or more sub-tasks. Each sub-task is an MCQ-style prompt
 *  with an artifact, so we can score it deterministically. The UI presents
 *  them as a split-view: artifact on the left, tasks stacked on the right. */
export interface PBQ {
  id: string;                // "PBQ-1"
  kind: "pbq";
  pbqKind: PBQKind;
  domain: Domain;            // primary domain — PBQ contributes to that slice
  objective: string;
  difficulty: Difficulty;
  title: string;
  scenario: string;          // the big narrative
  artifacts: Artifact[];     // one or more pieces of evidence
  tasks: PBQTask[];
  explanation: string;
  notes?: string[];
}

export interface PBQTask {
  id: string;                // "PBQ-1.T1"
  prompt: string;
  qualifier?: Qualifier;
  mode: "single" | "multi" | "order";
  choices: Choice[];
  /** For single/multi: choice ids. For order: the ids in correct sequence. */
  correct: string[];
  explanation: string;
}

export type BankItem = MCQ | PBQ;

/* ==========================================================================
   Exam metadata
   ========================================================================== */

export interface Exam {
  id: string;                // "exam-1" | "exam-2" | "exam-3"
  name: string;
  description: string;
  difficultyBias: Difficulty; // 1 = mostly baseline, 2 = intermediate, 3 = hardest
  targetMcqCount: number;
  targetPbqCount: number;
  durationMin: number;
}

export const EXAMS: Exam[] = [
  {
    id: "exam-1",
    name: "Exam 1 — Baseline",
    description: "Fundamentals across all four domains. Clear signals, classic CompTIA phrasing. Start here.",
    difficultyBias: 1,
    targetMcqCount: 28,
    targetPbqCount: 2,
    durationMin: 75,
  },
  {
    id: "exam-2",
    name: "Exam 2 — Intermediate",
    description: "Subtler distractors and mixed artifacts. Heavier on IR nuance and reporting judgment.",
    difficultyBias: 2,
    targetMcqCount: 30,
    targetPbqCount: 2,
    durationMin: 85,
  },
  {
    id: "exam-3",
    name: "Exam 3 — Toughest",
    description: "Ambiguous artifacts, noisy scenarios, judgment calls. Closest to exam day pressure.",
    difficultyBias: 3,
    targetMcqCount: 32,
    targetPbqCount: 2,
    durationMin: 95,
  },
];

/* Confidence tagging for adaptive future drills. */
export type Confidence = "know" | "unsure" | "guess";
