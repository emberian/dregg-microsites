// The approved relation is selected by this application, never by the proof bundle.
const approvedTemplate = '1afc2b3a120f59fdd79d273c6d32887373c5718225cb6e94b82a7231010c3aa7';
const base = new URL('./proof/learner-expiry/', import.meta.url);
const buttons = [...document.querySelectorAll('.proof-actions button')];
const panel = document.getElementById('proof-result');
const verdict = document.getElementById('proof-verdict');
const detail = document.getElementById('proof-detail');
let fixture;

function show(state, title, explanation) {
  panel.dataset.state = state;
  verdict.textContent = title;
  detail.textContent = explanation;
}

async function getFixture() {
  if (!fixture) {
    fixture = Promise.all(['template.json', 'public_rows.json', 'proof.bin'].map(async name => {
      const response = await fetch(new URL(name, base));
      if (!response.ok) throw new Error(`Unable to load ${name} (HTTP ${response.status}).`);
      return name === 'proof.bin' ? new Uint8Array(await response.arrayBuffer()) : await response.text();
    })).catch(error => { fixture = undefined; throw error; });
  }
  return fixture;
}

function runWorker(request) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./proof/worker.js', import.meta.url), { type: 'module' });
    const timeout = setTimeout(() => finish(new Error('Verification took longer than 90 seconds.')), 90000);
    function finish(error, value) {
      clearTimeout(timeout);
      worker.terminate();
      if (error) reject(error); else resolve(value);
    }
    worker.onerror = event => finish(new Error(event.message || 'The verifier could not start on this device.'));
    worker.onmessage = ({ data }) => finish(null, data);
    worker.postMessage({ id: 'learner-expiry', request });
  });
}

async function verify(changed) {
  buttons.forEach(button => { button.disabled = true; });
  show('busy', 'Loading the proof and verifier…', 'Only public ciphertext coefficients and proof data are downloaded.');
  try {
    const [template, rows, proof] = await getFixture();
    const publicRows = JSON.parse(rows);
    if (changed) publicRows[0][43] ^= 1;
    show('busy', 'Checking the proof…', changed
      ? 'The claimed output has been changed. The proof is the original.'
      : 'The WebAssembly verifier is checking the recorded update on your device.');
    const { result, elapsedMs } = await runWorker({ template, publicRows, proof, expectedTemplateSha256: approvedTemplate });
    const seconds = Number.isFinite(elapsedMs) ? ` ${(elapsedMs / 1000).toFixed(2)} seconds on this device.` : '';
    if (result.verified) {
      show(changed ? 'error' : 'accepted', changed ? 'Unexpected acceptance.' : 'Proof accepted.', changed
        ? 'The changed statement was accepted. This result needs investigation.'
        : `The real verifier accepted all 8,192 coefficient rows for the recorded update.${seconds}`);
    } else if (result.error?.startsWith('proof rejected:')) {
      show('rejected', 'Proof rejected.', changed
        ? `Changing one output digit made the original proof fail verification.${seconds}`
        : `The verifier rejected the downloaded statement and proof.${seconds}`);
    } else {
      show('error', 'Could not complete verification.', result.error || 'The verifier returned no decision.');
    }
  } catch (error) {
    show('error', 'Could not complete verification.', String(error.message || error));
  } finally {
    buttons.forEach(button => { button.disabled = false; });
  }
}

document.getElementById('verify-update').addEventListener('click', () => verify(false));
document.getElementById('verify-changed').addEventListener('click', () => verify(true));
