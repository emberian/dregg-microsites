# fn: a promise that survives

Independent source assessment, 20 September 2026. Assessor: Astra.

**Verdict:** ACL2 is doing useful engineering work in fn. Executable acceptance,
recovery, framing and protocol definitions are increasingly the definitions the
hosts call, and proof work has exposed actual model defects. There is substantial
progress toward a high-assurance service. The available evidence does **not** yet
establish an integrated, verified NNTP/BPv7 service.

This assessment freezes `3e1b1849413d5168322fcf34c9f74e77d109be72` (20 September,
15:02:15 −04:00). Claude continued changing the working tree during the review.
Historical laboratory records below retain their own revisions and platform
limits. A source inspection, a lane certification report, and a freshly rerun
check are deliberately different kinds of evidence. This is a sampled assessment,
not an exhaustive code audit or a new ACL2 certification.

The accompanying [source notebook](sources.html) contains numbered excerpts from
this frozen tree. [evidence.json](evidence.json) records file digests, local
commands and outcomes. The microsite is an assessment artifact, not fn's deferred
human-facing product client.

## What Claude has built

fn began as a small NNTP commons for humans and occasionally awake AI instances.
Its design now treats accepting an article as accepting a durable obligation:
preserve exact content, allocate local group numbers together, retain the content
until an authorized release, and distinguish an uncertain outcome from refusal.
Transport is a way of carrying that obligation's subject; transport success is
not the obligation itself. See `specs/storage.md`, `specs/retention.md` and
`specs/bp-design.md`.

The tree contains an executable news core, bounded codecs, an immutable-file
Store and recovery model, a served NNTP byte fold, a mutable owner with pinned
reader views, inbound peering and outbound feed machinery, contact scheduling,
BP application workflows and receipts, a native TCPCLv4 convergence layer,
statement/identity/policy models, and generated evidence tooling. Their maturity
differs. A file existing in the tree does not make it reachable in the service.

The specialized storage design is a sensible place for formal effort: local
numbers, duplicate history, reservations and retention obligations have to agree
on one commit. The current immutable-file implementation must also be distinguished
from proposed segment layouts and unfinished checkpoint/refinement work. Calling
all of these simply “the storage layer” hides the remaining obligations.

## Where ACL2 earns its place

**Decisions run in the logic.** `host/store-node-host.lisp:405` calls
`fn-sn-finish`; `tools/run_store.py:609` reaches that wrapper. The meaningful
completion result is supported by
`fn-sn-actual-durable-completion-installs-record` and
`fn-sn-finish-installs-exact-article-and-archive-pin`, with
`fn-sn-new-success-requires-actual-matching-durable-node-completion` connecting
new success to the matched transaction. This is stronger than checking a record
shape: the supplied completion must install the exact bound record. It still
depends on the storage machine receiving faithful I/O observations.

**Protocol composition has become a proof subject.**
`host/owner-host.lisp:464` calls `fn-own-read`, which calls `fn-served-step` in
`books/owner.lisp:678`. The key inductive append law is
`fn-served-feed-of-append`; `fn-served-step-partition-independence` carries it to
the served entry under a valid connection and octet-list inputs. The owner bridge
is named `fn-own-read-is-served-step-on-pinned-prefix`. This addresses the earlier
problem of proving a feed helper while the host ran a different loop. It covers
the stated byte fold and its effects, not arbitrary interleavings of external
commits, configuration changes, TLS handshakes or host failure.

**Reopen has a real relation to history.**
`fn-sn-open-observed-success-has-live-history-relation` connects the observed
loader with the composed invariant; `fn-sn-acknowledged-record-survives-observed-reopen`
retains an acknowledged pair under `fn-snt-relation`, membership in the success
history and `fn-sf-crash-imagep`. That last premise constrains the recovered
records to the stable history, optionally extended by the exact durable candidate.
It is the important boundary still to justify from bytes and platform behavior;
the theorem does not establish that an arbitrary disk image satisfies it.

**Proof work has rejected an intended theorem.** The byte model treated a pending
empty write beyond EOF differently from its tear semantics: one path extended
the file; the other had no pieces to apply. The storage lane recorded the concrete
counterexample and added nonempty pending writes to the invariant, justified by
the modeled write API. The broader admissible-view theorem remains open. This is
effective formal methods: find the incompatible meanings, repair the model, and
leave the unclosed obligation visible. See `HANDOFF-w9-storage.md`.

**Negative evidence is becoming concrete.** The Store test book builds a
reachable cross-post through allocation, staging and completion, then changes a
record's payload while preserving its transaction identifiers and checks that
the claimed exact record was not committed. These are better teeth than merely
asking ACL2 to fail a proof. Failure to prove an assertion is not, by itself,
a counterexample to the assertion.

**Efficiency belongs in the assurance argument.** Moving a whole-archive
recognizer out of each command prevents both repeated work and one malformed
article poisoning unrelated commands. The TCPCL lane similarly introduced a
cheap carried invariant for received data. Its outbound suffix still incurs
repeated traversal; a good inbound profile does not settle that cost. No new
asymptotic or production-capacity claim is made here.

## What is actually demonstrated along the pathways

| Path | Evidence observed | Exact boundary |
| --- | --- | --- |
| Store and reader | Historical deploy records show real CLI acceptance/refusal/uncertainty, recovery and NNTP replies | The cited deploy gate used a fallback reader after the owner failed. It does not demonstrate the current owner's concurrent service. |
| Peering | Inbound decisions, owner transit wiring, per-peer schedulers and a separate outbound feed driver exist | The w9 handoff still owes integrated owner certification and end-to-end peering. Earlier two-node and INN gates did not exercise successful fn transit. |
| Application DTN | The four-node carried-media lab records restart, lost/regenerated receipt, expiry/retry and reordered/duplicate work | Its BPA transport is a mock. The ACL2/Store path is exercised; real BP transport is not established by that lab. |
| LTP | The pinned ION lab carried a byte-identical fn request to fn's receiver and exercised interruption and expiry | ION implements BP/LTP. No receipt returned over BP; its destructive receive introduces a staging gap that needs application retry. This is not a verified fn LTP implementation. |
| Native TCPCLv4 | The w9 lab records native transfers, refusal, keepalives, process death/reconnect and a receive-only model differential; a dtn7 session exchanged a bundle's bytes | DTN-only image, loopback, dtn7 authored the bundle in both directions. No native BP node, application receipt or relay-release path follows. The sending host's auxiliary calls are outside the recorded replay differential. |
| Statements and authority | Carrier/verdict work plus reported certification of lace projection and transit policy books | Index/epoch obligations and their dependent tests remain open in the lane record. The verdict is not yet durably attached to transit acceptance or exposed by the served reader. |

The old owner arity bug in the milestone is already repaired at the assessed
revision: `fn-own-open` now supplies the current arguments, and `fn-own-read-step`
uses `fn-served-dispatch`. This does **not** imply the current owner certifies or
runs; the newer lane record names dependency failures instead. Treating the old
gate as proof of a current bug would be as wrong as treating a new helper as proof
of a working service.

## Findings requiring convergence

1. **The cryptographic implementation boundary is overstated in the architecture.**
   `books/crypto-attach.lisp` attaches executable ACL2 SHA-256 to both digest seams,
   with shape constraints discharged and vector tests recorded. Identity wrappers
   now call it. But `tools/frame_bridge.py:153,160` still uses `hashlib.sha256`, and
   `host/native/io.lisp:757,762` still uses `fnn-sha256` for frame trailers. The
   one-owner rule is not yet satisfied for framing. Shape preservation and test
   vectors also do not establish full SHA-256 standards equivalence, collision
   resistance or implementation side-channel resistance.

2. **Authentication is not integrated just because its book exists.**
   `books/auth-secret.lisp` describes a salted digest verifier, but
   `books/nntp-auth.lisp:382` still compares the stored clear secret with `equal`;
   `bin/fn` still writes that clear-secret configuration. The served fold calls
   `fn-peer-step`, not `fn-auth-step`. The server-polish handoff explicitly leaves
   AUTHINFO/STARTTLS wiring open. Implicit TLS on a listener is separate from
   authenticating a principal and enforcing its permission to post.

3. **The proposed password scheme needs a security decision, not just wiring.**
   Salted, domain-separated plain SHA-256 is a fast digest. For human-chosen
   passwords it is not a deliberately expensive password-hashing scheme. The
   `set-password` user flow makes that distinction practical. High-entropy
   machine secrets are a different profile and need explicit entropy, handling
   and threat assumptions. A theorem that a verifier is not an octet list proves
   a representation distinction; it does not prove secrecy. NIST's password
   guidance describes salt and a cost factor; this report does not claim fn is
   subject to, or conforms to, a NIST authentication level.

4. **The statement CLI is still a toy verification path.**
   `tools/stx.py:52` loads the toy crypto test book. `verify` labels its output as
   non-cryptographic. `sign --ed25519` emits a real signature separately, explicitly
   “not attached”; it does not turn the emitted FN-Statement carrier into a
   deployed Ed25519 artifact. This is honest experimental scaffolding, not a
   production native-signature workflow. Keep that boundary in user-visible
   output until an independently checked sign → carry → verify round trip exists.

5. **Crash fidelity is improving, but the hard byte relation remains open.**
   The new campaign compares recovered record counts with a namespace envelope
   computed by the byte model. It does not compare recovered record octets or
   enumerate torn fragments, and its deliberate unsafe-host control is not yet
   implemented. `fn-bs-scan-store` and the byte-to-record seam are absent at this
   revision. Local `transcribe_check.py` also reports missing host cuts, advisory
   syscall drift and explicitly unmodeled composite/transport boundaries. Its
   zero fidelity-defect category does not make the other categories disappear.
   SIGKILL leaves the OS page cache alive; it is not power-loss qualification.

6. **A complete BPv7 node is still a design at this snapshot.**
   `books/bp-bundle.lisp` and `books/bp-node.lisp` are absent. The primary-block
   codec, application workflow and native convergence layer are valuable pieces,
   but none substitutes for full bundle parsing, node retention/forwarding and
   the application receipt path composed with durable state. BP delivery reports
   do not say an application processed its payload; fn's stronger receipt must
   establish fn's own retained-content obligation under explicit peer assumptions.

7. **The local boundary test suite has contract drift.**
   In the frozen tree, selected ledger/certification-runner/boundary tests finish
   with errors confined to `tests.test_host_boundary`: old callers omit mandatory
   `--bundle` or `bundle=` arguments. They fail before exercising the intended
   refusal/uncertainty cases. This is missing current evidence, not a demonstrated
   loss of articles. `make check` passes its structural checks while explicitly
   skipping dynamic host loading because `FN_ACL2` is unset. Neither result is a
   current whole-system certification.

## What assurance means here

Assurance is a justified claim about a particular implementation, for a particular
use, under stated assumptions. For fn it should answer concrete questions:

- **Meaning:** Do NNTP status codes, native statements and application receipts
  mean what their users think? Are source bytes, Message-IDs, content digests and
  local group numbers kept distinct?
- **Safety:** Can a stale completion accept the wrong transaction, a duplicate
  allocate again, a cross-post become partial, or a release erase an independent
  obligation? A finite-trace theorem should rule out the exact bad event.
- **Recovery:** Which issued writes and observed barriers may survive each cut?
  Does the actual loader recover a permitted history, including accepted work?
  The answer needs the byte model, host trace relation and qualified platform.
- **Authority:** Which key signed which bytes, under which policy and epoch?
  Can a relay preserve conflicting evidence without letting it acquire authority?
  Key compromise, revocation and disconnected policy views require their own
  contracts. A signature does not establish the truth of a message.
- **Availability and progress:** Can a hostile input exhaust work or memory? Can
  a retained article be read after other users post? Delivery requires adequate
  contact, resources and cooperative surviving peers; safety alone does not
  prove eventual delivery.
- **Operations:** Can an operator install, upgrade, back up, recover and inspect
  one reproducible build without losing the promises it already accepted?
  Resource refusal is part of a retention promise, not an implementation nuisance.

The evidence should connect **claim → exact theorem and hypotheses → called
function → representation/I/O relation → fault and interop evidence → deployment
profile**. A missing edge matters more than a large number of declarations.
ACL2 admission, guard verification, certification, known-answer vectors, mutation
tests, fault experiments and hardware qualification answer different questions.
The generated ledger is a useful locator and drift detector, not a coverage score.

## Infrastructure people and agents can share

The useful shared foundation is inspectable memory with explicit obligations.
A human returning next week and an agent restarting without context can recover
the same accepted article. Retries can identify the same work. Provenance can
travel across gateways. Independent nodes can preserve forks as evidence rather
than silently resolve them by arrival time. Those benefits are architectural
intent with growing component support; their full composition is still owed.

There are separate questions above transport: what participants believe, what
they consent to retain, how they govern groups, and what an agent is allowed to
execute. A verified article is still untrusted input to an agent. Its signature
cannot authorize tools merely by being valid. The application needs its own
permission boundary. Private groups likewise need an encryption and membership
design; this assessment establishes no confidentiality claim.

For disconnected or extraterrestrial operation, the promising idea is to preserve
the obligation while replacing an expired carrier. Contact schedules, long RTTs,
asymmetry, clock uncertainty, energy/storage scarcity and autonomous recovery must
be modeled and tested in a specific mission profile. LTP and TCPCL evidence gets
fn closer to that experiment. It does not qualify software, hardware or operating
procedures for flight.

## The next coherent completion batches

1. **Serve one complete promise.** Freeze an integrated revision; certify the
   actual owner and dependencies; build the ordinary deployment image; run a real
   client through POST, a concurrent reader, lost reply, recovery and retry. Check
   that capabilities and replies describe what that very image can do.
2. **Close the survival relation.** Implement the byte scanner/refinement, match
   host cuts in both directions, check exact recovered bytes and obligations,
   and demonstrate that a deliberately misordered host fails the campaign. Then
   qualify the stated barrier contract on an identified platform.
3. **Carry a promise between nodes.** Join owner acceptance to the persistent
   feed, then complete native BP bundle/node/receipt integration. Exercise real
   outages and expiry; show the application obligation survives loss of a carrier
   and that retry does not duplicate its effect.
4. **Make authority independently checkable.** Finish the deployed signature
   artifact and verifier, persist the verdict/context alongside acceptance, wire
   policy and authentication through the served path, and reconcile source and
   architecture claims. Keep privacy as a separate reviewed design.

Independent implementation can continue across these batches. Each closes a
user-visible claim with one frozen integrated review; the point is to finish
paths, not to create another serial review queue.

## External references checked

- [ACL2 defattach documentation](https://acl2.org/doc/index-seo.php?xkey=ACL2____DEFATTACH):
  execution attachments must satisfy constraints; attaching a real function does
  not promote a shape-only seam to a cryptographic security theorem.
- [RFC 9171 §5.7](https://www.rfc-editor.org/rfc/rfc9171.html#section-5.7):
  delivery to the application agent is distinct from processing its payload.
- [NIST SP 800-63B-4, password verifiers](https://pages.nist.gov/800-63-4/sp800-63b.html#passwordver):
  password hashing includes a salt and cost factor to resist offline guessing.

No development, service deployment or publication in the active fn tree was
performed for this assessment. Tests were run in an archive of the pinned
revision; the source repository continued moving independently.
