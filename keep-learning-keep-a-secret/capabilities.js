'use strict';
(() => {
  const models = {
    fhe: {
      kicker: 'FHE / the encrypted learner', title: 'Work on ciphertext.',
      description: 'The evaluator can update encrypted state without opening it. Our running nonlinear benchmark still retains a full reader key for the final correctness audit.',
      compute: 'Encrypted operations', proof: 'Encryption alone does not certify the operation', read: 'Full reader remains in this benchmark', history: 'Copies and forks require separate treatment'
    },
    vfhe: {
      kicker: 'vFHE / computation with evidence', title: 'Prove the encrypted operation.',
      description: 'A verifier checks a proof of the specified ciphertext computation. This can protect integrity; removing unrestricted decryption authority is an additional construction problem.',
      compute: 'Encrypted operations', proof: 'The exact encoded relation', read: 'A computation proof does not remove a reader key', history: 'Only the context actually bound by the relation'
    },
    fe: {
      kicker: 'FE / function-specific authority', title: 'Keep a narrower capability.',
      description: 'A functional key reveals its permitted function of encrypted inputs. Our designated construction gives fixed projections, and those keys remain usable on archived inputs outside the software journal.',
      compute: 'The issued function or fixed span', proof: 'Separate from the functional-encryption promise', read: 'The full issued span, including coalition combinations', history: 'Retained credentials may be reused on retained inputs'
    },
    target: {
      kicker: 'Research target / not yet one construction', title: 'Continue without a universal reader.',
      description: 'One mechanism would preserve useful hidden learned state, certify its permitted transition, and release only the authorized answer under an explicit continuity assumption.',
      compute: 'Useful Learn and Infer with reusable protected state', proof: 'Transition plus its admitted context', read: 'No surviving equivalent full-reader capability', history: 'A declared continuing history, with forks accounted for'
    }
  };
  const controls = Array.from(document.querySelectorAll('[data-model]'));
  controls.forEach(button => button.addEventListener('click', () => {
    const model = models[button.dataset.model];
    if (!model) return;
    controls.forEach(control => control.setAttribute('aria-pressed', String(control === button)));
    document.getElementById('model-kicker').textContent = model.kicker;
    document.getElementById('model-title').textContent = model.title;
    document.getElementById('model-description').textContent = model.description;
    ['compute', 'proof', 'read', 'history'].forEach(key => { document.getElementById(`cap-${key}`).textContent = model[key]; });
  }));
})();
