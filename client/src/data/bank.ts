import type { BankItem, Exam, Domain, MCQ, PBQ } from "@/lib/types";
import { DOMAIN_1 } from "./bank-domain-1";
import { DOMAIN_2 } from "./bank-domain-2";
import { DOMAIN_3 } from "./bank-domain-3";
import { DOMAIN_4 } from "./bank-domain-4";
import { EXTRAS } from "./bank-extras";
import { PBQS } from "./pbqs";

/* Full MCQ bank (all domains) */
export const ALL_MCQS: MCQ[] = [
  ...DOMAIN_1,
  ...DOMAIN_2,
  ...DOMAIN_3,
  ...DOMAIN_4,
  ...EXTRAS,
];

export const ALL_PBQS: PBQ[] = PBQS;

export const ALL_ITEMS: BankItem[] = [...ALL_MCQS, ...ALL_PBQS];

/* Lookup by id — used by runner + review */
export const ITEM_BY_ID: Record<string, BankItem> = Object.fromEntries(
  ALL_ITEMS.map((q) => [q.id, q]),
);

/* MCQs grouped by domain */
export const MCQS_BY_DOMAIN: Record<Domain, MCQ[]> = {
  "1.0": ALL_MCQS.filter((q) => q.domain === "1.0"),
  "2.0": ALL_MCQS.filter((q) => q.domain === "2.0"),
  "3.0": ALL_MCQS.filter((q) => q.domain === "3.0"),
  "4.0": ALL_MCQS.filter((q) => q.domain === "4.0"),
};

/* PBQs grouped by domain */
export const PBQS_BY_DOMAIN: Record<Domain, PBQ[]> = {
  "1.0": ALL_PBQS.filter((p) => p.domain === "1.0"),
  "2.0": ALL_PBQS.filter((p) => p.domain === "2.0"),
  "3.0": ALL_PBQS.filter((p) => p.domain === "3.0"),
  "4.0": ALL_PBQS.filter((p) => p.domain === "4.0"),
};

/* ==========================================================================
   Deterministic pseudo-random generator — seeded by exam id.
   This means Exam 1 is always the same set of questions per build, while
   still sampling from the bank weighted to domain percentages.
   ========================================================================== */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* Difficulty curve — biases sampling toward the exam's target difficulty
   without being absolute (so all exams still sample some of each). */
function difficultyWeight(target: 1 | 2 | 3, actual: 1 | 2 | 3): number {
  const table: Record<string, number> = {
    "1-1": 3, "1-2": 2, "1-3": 1,
    "2-1": 2, "2-2": 3, "2-3": 2,
    "3-1": 1, "3-2": 2, "3-3": 3,
  };
  return table[`${target}-${actual}`] ?? 1;
}

function weightedSample<T extends { difficulty: 1 | 2 | 3 }>(
  pool: T[],
  count: number,
  targetDifficulty: 1 | 2 | 3,
  rand: () => number,
): T[] {
  const picked: T[] = [];
  const remaining = pool.slice();
  while (picked.length < count && remaining.length > 0) {
    const weights = remaining.map((q) => difficultyWeight(targetDifficulty, q.difficulty));
    const total = weights.reduce((a, b) => a + b, 0);
    let r = rand() * total;
    let idx = 0;
    for (; idx < weights.length; idx++) {
      r -= weights[idx];
      if (r <= 0) break;
    }
    idx = Math.min(idx, remaining.length - 1);
    picked.push(remaining[idx]);
    remaining.splice(idx, 1);
  }
  return picked;
}

/* ==========================================================================
   Exam generator — per exam, produce an ordered list of item IDs.
   Sampling:
     - Allocate targetMcqCount across domains per official weights (33/30/20/17)
     - For PBQs, sample targetPbqCount biased toward exam's primary domains
     - Interleave PBQs into the MCQ stream
   ========================================================================== */
export function generateExam(exam: Exam): string[] {
  const rand = mulberry32(hashString(exam.id));

  const weights: Record<Domain, number> = {
    "1.0": 0.33, "2.0": 0.30, "3.0": 0.20, "4.0": 0.17,
  };

  const mcqsPerDomain: Record<Domain, number> = {
    "1.0": Math.round(exam.targetMcqCount * weights["1.0"]),
    "2.0": Math.round(exam.targetMcqCount * weights["2.0"]),
    "3.0": Math.round(exam.targetMcqCount * weights["3.0"]),
    "4.0": Math.round(exam.targetMcqCount * weights["4.0"]),
  };
  // Correct rounding drift
  const drift = exam.targetMcqCount - Object.values(mcqsPerDomain).reduce((a, b) => a + b, 0);
  if (drift !== 0) mcqsPerDomain["1.0"] += drift;

  // Sample MCQs per domain — cap at pool size
  const sampledMcqs: MCQ[] = [];
  (Object.keys(mcqsPerDomain) as Domain[]).forEach((d) => {
    const want = Math.min(mcqsPerDomain[d], MCQS_BY_DOMAIN[d].length);
    sampledMcqs.push(...weightedSample(MCQS_BY_DOMAIN[d], want, exam.difficultyBias, rand));
  });

  // Sample PBQs — prefer variety across kinds
  const shuffledPbqs = shuffle(ALL_PBQS, rand);
  const sampledPbqs = shuffledPbqs.slice(0, Math.min(exam.targetPbqCount, shuffledPbqs.length));

  // Build an interleaved exam order: PBQs spread roughly evenly
  const shuffledMcqs = shuffle(sampledMcqs, rand);
  const total = shuffledMcqs.length + sampledPbqs.length;
  const examOrder: BankItem[] = [];
  let mcqIdx = 0;
  const pbqPositions = sampledPbqs.map((_, i) =>
    Math.floor(((i + 1) * total) / (sampledPbqs.length + 1)),
  );
  for (let i = 0; i < total; i++) {
    const pbqSlot = pbqPositions.indexOf(i);
    if (pbqSlot !== -1 && sampledPbqs[pbqSlot]) {
      examOrder.push(sampledPbqs[pbqSlot]);
    } else if (mcqIdx < shuffledMcqs.length) {
      examOrder.push(shuffledMcqs[mcqIdx++]);
    }
  }
  // Flush any remaining MCQs
  while (mcqIdx < shuffledMcqs.length) examOrder.push(shuffledMcqs[mcqIdx++]);

  return examOrder.map((x) => x.id);
}
