import type { BankItem, MCQ, PBQ, Domain } from "./types";
import { ITEM_BY_ID, ALL_MCQS } from "@/data/bank";

export type Answers = Record<string, string[]>;         // itemId -> selected choice ids
export type TaskAnswers = Record<string, string[]>;     // "PBQ-1.T1" -> selected choice ids

/** Whether the selection is exactly correct (order matters for 'order' tasks). */
export function isCorrect(correct: string[], selected: string[], ordered = false): boolean {
  if (correct.length !== selected.length) return false;
  if (ordered) return correct.every((v, i) => v === selected[i]);
  const cs = [...correct].sort();
  const ss = [...selected].sort();
  return cs.every((v, i) => v === ss[i]);
}

/** Score a single MCQ — 1.0 correct or 0. */
export function scoreMCQ(mcq: MCQ, selected: string[] | undefined): number {
  if (!selected || selected.length === 0) return 0;
  return isCorrect(mcq.correct, selected) ? 1 : 0;
}

/** Score a PBQ — average of task correctness (0..1 per task). */
export function scorePBQ(pbq: PBQ, answers: Answers): number {
  if (pbq.tasks.length === 0) return 0;
  let sum = 0;
  for (const t of pbq.tasks) {
    const sel = answers[t.id];
    if (!sel) continue;
    const ok = isCorrect(t.correct, sel, t.mode === "order");
    if (ok) sum += 1;
  }
  return sum / pbq.tasks.length;
}

export interface ExamScore {
  /** overall percent 0-100 */
  overall: number;
  mcqPercent: number;
  pbqPercent: number;
  byDomain: Record<Domain, { total: number; earned: number; percent: number }>;
  mcqCount: number;
  pbqCount: number;
  // distractor-trap analytics
  patterns: {
    rightActionWrongPhase: number;
    rightToolWrongPurpose: number;
    validButNotBest: number;
    scopeMismatch: number;
    policyVsOps: number;
  };
  /** textual narrative insights for the user */
  insights: string[];
}

export function scoreExam(itemIds: string[], answers: Answers): ExamScore {
  const byDomain: Record<Domain, { total: number; earned: number; percent: number }> = {
    "1.0": { total: 0, earned: 0, percent: 0 },
    "2.0": { total: 0, earned: 0, percent: 0 },
    "3.0": { total: 0, earned: 0, percent: 0 },
    "4.0": { total: 0, earned: 0, percent: 0 },
  };
  const patterns = {
    rightActionWrongPhase: 0,
    rightToolWrongPurpose: 0,
    validButNotBest: 0,
    scopeMismatch: 0,
    policyVsOps: 0,
  };

  let mcqEarned = 0, mcqTotal = 0, pbqEarned = 0, pbqTotal = 0;

  for (const id of itemIds) {
    const item = ITEM_BY_ID[id];
    if (!item) continue;
    if (item.kind === "mcq") {
      const s = scoreMCQ(item, answers[id]);
      mcqTotal += 1;
      mcqEarned += s;
      byDomain[item.domain].total += 1;
      byDomain[item.domain].earned += s;
      if (s === 0 && answers[id]) {
        for (const pick of answers[id]) {
          const ch = item.choices.find((c) => c.id === pick);
          if (!ch?.trap) continue;
          switch (ch.trap) {
            case "right-action-wrong-phase": patterns.rightActionWrongPhase++; break;
            case "right-tool-wrong-purpose": patterns.rightToolWrongPurpose++; break;
            case "valid-but-not-best": patterns.validButNotBest++; break;
            case "scope-mismatch": patterns.scopeMismatch++; break;
            case "policy-vs-ops": patterns.policyVsOps++; break;
          }
        }
      }
    } else {
      const s = scorePBQ(item, answers);
      pbqTotal += 1;
      pbqEarned += s;
      byDomain[item.domain].total += 1;
      byDomain[item.domain].earned += s;
    }
  }

  (Object.keys(byDomain) as Domain[]).forEach((d) => {
    const row = byDomain[d];
    row.percent = row.total > 0 ? Math.round((row.earned / row.total) * 100) : 0;
  });

  const mcqPercent = mcqTotal > 0 ? Math.round((mcqEarned / mcqTotal) * 100) : 0;
  const pbqPercent = pbqTotal > 0 ? Math.round((pbqEarned / pbqTotal) * 100) : 0;
  const overallEarned = mcqEarned + pbqEarned;
  const overallTotal = mcqTotal + pbqTotal;
  const overall = overallTotal > 0 ? Math.round((overallEarned / overallTotal) * 100) : 0;

  const insights: string[] = [];
  if (patterns.rightActionWrongPhase >= 2)
    insights.push("You tend to pick actions that are right for a different phase. Re-read PICERL and note which step the scenario is actually in.");
  if (patterns.rightToolWrongPurpose >= 2)
    insights.push("Several answers reflect a 'right tool, wrong purpose' habit — double-check that the tool you picked solves the precise problem in the stem, not a related one.");
  if (patterns.validButNotBest >= 2)
    insights.push("You often pick technically valid but not optimal answers. Pay closer attention to qualifiers like BEST, FIRST, and MOST.");
  if (patterns.scopeMismatch >= 2)
    insights.push("Watch for scope mismatches — if the scenario says one host, don't pick domain-wide responses (or vice versa).");
  if (patterns.policyVsOps >= 2)
    insights.push("You lean toward policy/governance answers when the question asks for an immediate operational step.");

  if (byDomain["3.0"].total > 0 && byDomain["3.0"].percent < 70)
    insights.push("Your Incident Response domain is below 70% — review IR-Playbooks and the PICERL sequence notes.");
  if (byDomain["2.0"].total > 0 && byDomain["2.0"].percent < 70)
    insights.push("Vulnerability Management is below 70% — practice CVSS v3.1 and KEV/EPSS prioritization.");
  if (byDomain["1.0"].total > 0 && byDomain["1.0"].percent < 70)
    insights.push("Security Operations is below 70% — focus on SIEM tuning, log correlation, and MITRE ATT&CK mapping.");
  if (byDomain["4.0"].total > 0 && byDomain["4.0"].percent < 70)
    insights.push("Reporting & Communication is below 70% — study regulatory timelines (GDPR/HIPAA/PCI) and audience-aware reporting.");

  if (pbqTotal > 0 && pbqPercent < mcqPercent - 15)
    insights.push("You're noticeably weaker on PBQs than MCQs. Practice reading multi-source artifacts holistically before answering.");

  if (insights.length === 0)
    insights.push("Strong, balanced performance. Consider retaking at a higher difficulty bias or focusing drills on your weakest domain.");

  return { overall, mcqPercent, pbqPercent, byDomain, mcqCount: mcqTotal, pbqCount: pbqTotal, patterns, insights };
}

/** Highlight qualifier words in a stem string with <span class="qualifier">. */
export function highlightQualifiers(stem: string): string {
  const qualifiers = ["FIRST", "BEST", "NEXT", "MOST likely", "MOST", "LEAST", "Select TWO", "Select THREE", "TWO", "THREE"];
  let out = stem;
  for (const q of qualifiers) {
    const re = new RegExp(`\\b${q}\\b`, "g");
    out = out.replace(re, (m) => `<span class="qualifier">${m}</span>`);
  }
  return out;
}

export { ALL_MCQS };
export type { BankItem };
