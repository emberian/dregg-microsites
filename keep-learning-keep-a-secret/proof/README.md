# Actual learner-update verifier

These are the public WebAssembly verifier and learner-expiry fixture from
`emberian/zkml-research`, `research/vfhe_2026_09_08/browser_verifier/`.
The source package contains the Rust wrapper, dependency lockfile, build script,
native verifier, Lean-generated relation and executed acceptance/rejection results.

The app pins template SHA256
`1afc2b3a120f59fdd79d273c6d32887373c5718225cb6e94b82a7231010c3aa7`.
The WASM module is SHA256
`96137c1ed0ad5fc7584ca72ef006ff70ac1951831408ee12ab22ce3879f6f908`.

The proof covers the exact public stored-NTT coefficient equation
`out = acc + fresh - old (mod q)` for the running text learner's event 65:
two ciphertext components, 4,096 slots and two RNS primes. The same actual
Plonky3 DescriptorIR-v2 verifier runs in a Web Worker. A portable deterministic
salt is used only for public preprocessing; the shared backend forwards private
commitments and the other PCS operations to the existing hiding implementation.
This is an explicitly adjusted backend configuration, not a security upgrade.

The browser checks the selected coefficient relation. It does not deserialize
the BFV payloads, authorize the event, enforce FIFO expiry, prove encoder
correctness or remove the learner's full reader key. No secret keys are included.
The page reports acceptance only after the verifier returns it. Its changed-output
button changes public row zero's output digit 43 and calls the same verifier with
the same proof.

## Two-class query consumer

The shared query worker, application pins and consumer come from
`research/vfhe_2026_09_08/query_browser_verifier/`. The replacement application
pins and two public cases come from its `fast_successor/` package and live in
`../query-bundle/fixtures/`: they are the actual fast001 query from the21.20-second
complete run. The page requires its specific case ID as well as both proof acceptances. The worker reuses the exact WASM module above and accepts only
after both actual proofs verify against the pinned template and coefficient rows.
The standalone consumer passed under Node WASM; no browser-engine execution was
available during integration. The page glue passed JavaScript syntax checks.

This covers both plaintext products and their subtraction for each class. The
consumer pins the saved request context but does not prove authorization, ciphertext
decoding, text encoding, private decryption or the final plaintext ranking.
Incremental public assets are about4.96MB uncompressed; no second WASM copy is used.
