# dregg microsites

Small, self-contained visual essays from the DREGG research process.

## New local report

- [A promise that survives](a-promise-that-survives/) — independent assessment of
  fn at `3e1b184`: executable ACL2, NNTP, storage, DTN and assurance. Includes an
  interactive failure-boundary illustration, an agent deployment design, a full written assessment, frozen
  source excerpts and a machine-readable evidence manifest. Publication is a
  separate step.

The fn report's UI can be checked locally with `node tools/check_fn_report.cjs`
(uses the existing `tools/node_modules/puppeteer-core` and local Google Chrome).
It records its input digests and results in the report's `ui-check.json`, and
writes screenshots to a temporary directory. This validates the report, not fn.
The separate `evidence.json` links the raw logs of the checks run on frozen fn
source; those checks did not include a fresh ACL2 certification.

- [The call tree, certified](call-tree/) — one agent turn over HTTPS (GLM asks for a tool, the
  tool fetches a page through its own attested hop, GLM answers): four TLSNotary MPC-TLS hops, one
  Merkle root, dataflow edges, checked offline by the Lean-extracted `calltree-check`
  (breadstuffs initiative 9). Publication is a separate step.

- [The record is a tree](tree-receipt/) — tree certificates over one agent session's 3,382 tool
  calls: one path opened per record, exact counts (13 mentions of `pkill -f`, 7 at command position
  with backticks, 0 without), checked by the Lean-extracted `tree-check`. Publication is a
  separate step.

## Published

- [field guide](https://emberian.github.io/dregg-microsites/field-guide/)

- [The whole way through](https://emberian.github.io/dregg-microsites/the-whole-way-through/)
- [Keep learning. Keep a secret.](https://emberian.github.io/dregg-microsites/keep-learning-keep-a-secret/)

- [Plan to compost at least three](https://emberian.github.io/dregg-microsites/plan-to-compost-at-least-three/)
- [Fourteen rooms](https://emberian.github.io/dregg-microsites/fourteen-rooms/)
- [Two phones](https://emberian.github.io/dregg-microsites/two-phones/)
- [A clutch of eggs](https://emberian.github.io/dregg-microsites/a-clutch-of-eggs/)
- [Make the digest a proof](https://emberian.github.io/dregg-microsites/make-the-digest-a-proof/)
- [Trust me, in Latin](https://emberian.github.io/dregg-microsites/trust-me-in-latin/)
- [Green is not true](https://emberian.github.io/dregg-microsites/green-is-not-true/)
- [Prove the turn, not the machine](https://emberian.github.io/dregg-microsites/prove-the-turn/)
- [The cheat is unsatisfiable](https://emberian.github.io/dregg-microsites/the-cheat-is-unsatisfiable/)
- [The fix is a theorem](https://emberian.github.io/dregg-microsites/the-fix-is-a-theorem/)
- [Months in evenings](https://emberian.github.io/dregg-microsites/months-in-evenings/)
- [Promises, priced](https://emberian.github.io/dregg-microsites/promises-priced/)
- [Which model?](https://emberian.github.io/dregg-microsites/which-model/)
- [Reading a millennium proof](https://emberian.github.io/dregg-microsites/reading-a-millennium-proof/)
- [Absence receipt](https://emberian.github.io/dregg-microsites/absence-receipt/) — 100,000 public crates.io index documents, two forbidden byte patterns, count 0, which leg is proved, re-executed, hashed, signed.

The site is plain, dependency-free HTML published from the root of `main` with
GitHub Pages.
