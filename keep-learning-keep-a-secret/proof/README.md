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
