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

function runQueryWorker() {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./proof/shared-query-worker.js', import.meta.url), { type: 'module' });
    const timeout = setTimeout(() => finish(new Error('Verification took longer than 90 seconds.')), 90000);
    let finished = false;
    function finish(error, value) {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      worker.terminate();
      if (error) reject(error); else resolve(value);
    }
    worker.onerror = event => finish(new Error(event.message || 'The query verifier could not start on this device.'));
    worker.onmessage = ({ data }) => {
      if (data.id !== 'two-class-query') return;
      if (data.type === 'progress') {
        const progress = data.progress;
        if (progress.stage === 'verifying') {
          show('busy', `Checking class ${progress.completed + 1} of ${progress.total}…`, 'The actual verifier is checking both products and their subtraction for this class.');
        }
      } else if (data.type === 'result') {
        finish(null, data.result);
      }
    };
    worker.postMessage({ id: 'two-class-query', bundleBaseUrl: new URL('./query-bundle/', import.meta.url).href });
  });
}

async function verifyQuery() {
  buttons.forEach(button => { button.disabled = true; });
  show('busy', 'Loading both query proofs…', 'Only public coefficient rows, proof data and the shared verifier are downloaded.');
  try {
    const result = await runQueryWorker();
    if (result.verified === true && result.caseId === 'fast001-new-two-class-query') {
      const seconds = Number.isFinite(result.elapsedMs) ? ` ${(result.elapsedMs / 1000).toFixed(2)} seconds including loading on this device.` : '';
      show('accepted', 'Both class computations verified.', `The real verifier accepted the complete coefficient relation for each of the two recorded classes.${seconds} This does not verify decryption or the final class choice.`);
    } else if (result.stage === 'proof' && result.error?.startsWith('proof rejected:')) {
      show('rejected', 'Query proof rejected.', result.error);
    } else {
      show('error', 'Could not complete query verification.', result.error || 'Both approved class proofs were not accepted.');
    }
  } catch (error) {
    show('error', 'Could not complete query verification.', String(error.message || error));
  } finally {
    buttons.forEach(button => { button.disabled = false; });
  }
}

document.getElementById('verify-query').addEventListener('click', verifyQuery);
