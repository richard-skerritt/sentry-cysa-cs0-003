# Contributing to Sentry

Thanks for your interest in improving Sentry. This guide covers how to run the project, the house style for authoring new questions, and the review bar for pull requests.

## Ground rules

1. **Original content only.** Every question, answer, distractor, and explanation you contribute must be written from scratch based on your own understanding of the published CompTIA CS0-003 exam objectives. Do not paste, paraphrase, translate, or re-word material from the official exam, official CompTIA practice tests, or any third-party copyrighted study product (books, courses, question banks, flash-card apps, etc.). Pull requests containing such material will be closed.
2. **Be kind in reviews.** Cybersecurity is a wide field and reasonable people disagree about what the "best" action is. If you think an answer key is wrong, open an issue with your reasoning before submitting a PR.
3. **Keep the SOC-seat feel.** Questions should read like situations you'd meet on a real shift, not textbook definitions.

## Development

```bash
npm install
npm run dev          # Express + Vite on port 5000
npm run build        # Production client + server bundle
npx tsc --noEmit     # Type-check only
```

## Authoring an MCQ

Add your question to `client/src/data/bank.ts`:

```ts
{
  id: 'SO-068',                       // Domain prefix + next number
  domain: 'security-operations',      // One of four
  difficulty: 'intermediate',         // baseline | intermediate | toughest
  qualifier: 'BEST',                  // FIRST | BEST | NEXT | MOST | LEAST | TWO | THREE
  stem: 'A SOC analyst sees ...',
  options: [
    { id: 'A', text: '...', correct: true,  pattern: null },
    { id: 'B', text: '...', correct: false, pattern: 'right-tool-wrong-purpose' },
    { id: 'C', text: '...', correct: false, pattern: 'valid-but-not-best' },
    { id: 'D', text: '...', correct: false, pattern: 'scope-mismatch' },
  ],
  explanation: {
    whyCorrect: 'Short rationale — what makes this the BEST choice given the qualifier.',
    keyPhrase: 'the one phrase that unlocks it',
    studyRef: 'SIEM-and-Log-Analysis',
  },
}
```

### Authoring checklist

- [ ] Stem reads like a real scenario (an alert, a stakeholder request, a log snippet)
- [ ] Exactly one qualifier appears in the stem, in ALL CAPS, matching the `qualifier` field
- [ ] Three plausible distractors — no obvious throwaway options
- [ ] Each distractor is tagged with the pattern it represents
- [ ] No "all of the above" or "none of the above"
- [ ] Explanation names the key phrase a test-taker should latch onto
- [ ] `studyRef` matches an existing file under `client/src/content/`

### Distractor patterns

| Pattern | When to use |
| --- | --- |
| `right-action-wrong-phase` | The option is the correct action, but for a different phase of the IR / vulnerability / detection lifecycle |
| `right-tool-wrong-purpose` | The option names a real tool, but one that doesn't answer the precise question |
| `valid-but-not-best` | The option works, but another option is faster / safer / higher signal |
| `scope-mismatch` | The option is technically fine but out of scope for the analyst role or the stated environment |
| `policy-vs-ops` | The option is a policy / governance answer when the stem asks for an operational one (or vice versa) |

## Authoring a PBQ

PBQs live in `client/src/data/pbqs.ts` and have a richer structure — an artifact block plus one or more tasks. Open an issue first if you want to add one; PBQ authoring has enough nuance that a design conversation up front saves rework.

## Pull requests

- Branch from `main` with a descriptive name (`feat/vuln-mgmt-mcqs`, `fix/review-mode-key-phrase`)
- One logical change per PR
- `npx tsc --noEmit` and `npm run build` must both pass
- Include before/after screenshots for any UI change

## Reporting issues

Use GitHub Issues. Include:

- What you expected vs what happened
- Exam ID / question ID if the issue is content-related
- Browser + OS if the issue is UI-related
