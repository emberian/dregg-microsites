'use strict';

(() => {
  const labels = { proof_integrity: 'Proof integrity', runtime_performance: 'Runtime performance' };
  const checkpoints = {
    initial: { title: 'The first accepted memory', description: 'Four teachings make two examples available in each class. The same held-out issue will be asked again as this memory changes.', fresh: ['pi01', 'pi02', 'rp01', 'rp02'] },
    after_teaching: { title: 'Six more examples later', description: 'The proof-integrity class now holds eight examples. The runtime-performance class keeps its original two.', fresh: ['pi03', 'pi04', 'pi05', 'pi06', 'pi07', 'pi08'] },
    after_expiry: { title: 'A full memory makes room', description: 'Teachings nine and ten replace pi01 and pi02. The eight retained examples are now pi03 through pi10; expiry changes the encrypted accumulator.', fresh: ['pi09', 'pi10'] },
    after_restart: { title: 'The same state, reopened', description: 'The workload reopens the same durable revision and repeats the query. A completed restart query is checked against the pre-restart answer.', fresh: [] }
  };
  const number = value => Number(value).toLocaleString('en-US');
  const bytes = value => `${(Number(value) / 1000000).toFixed(2)} MB`;
  const seconds = value => `${Number(value).toFixed(2)} s`;
  const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let record, runId, checkpointId = 'initial', selectedText;

  function getRun() { return record.runs.find(run => run.id === runId); }
  function metric(label, value) { return `<div><strong>${escape(value)}</strong><span>${escape(label)}</span></div>`; }

  function renderSummary() {
    const run = getRun();
    const m = run.metrics;
    document.getElementById('record-date').textContent = new Date(run.updated_utc).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC';
    document.getElementById('run-completion').textContent = run.complete ? `${run.completed_operations}/${run.required_operations} operations completed` : `${run.completed_operations}/${run.required_operations} operations in this partial record`;
    document.getElementById('run-summary').innerHTML = [
      metric('committed teachings', number(m.committed_updates)),
      metric('answered queries', number(m.answered_queries)),
      metric('proofs independently verified', number(m.proofs_verified)),
      metric('distinct proof data', bytes(m.proof_bytes)),
      metric('recorded worker-attempt wall time', seconds(run.worker_attempt_wall_seconds))
    ].join('');
    const a = document.createElement('a');
    a.href = run.source_url;
    a.textContent = 'Run evidence ↗';
    document.getElementById('record-source').replaceChildren(a);
    renderCheckpoint();
  }

  function memoryRow(label, snapshot, fresh) {
    const queue = snapshot.model[label].queue;
    let slots = queue.map(item => `<li class="slot${fresh.includes(item.text_id) ? ' fresh' : ''}"><button type="button" data-text="${escape(item.text_id)}" aria-pressed="${item.text_id === selectedText}" aria-label="Read teaching ${escape(item.text_id)}">${escape(item.text_id)}</button></li>`).join('');
    slots += Array.from({ length: record.capacity - queue.length }, () => '<li class="slot empty" aria-label="Empty memory slot">·</li>').join('');
    return `<div class="memory-row"><div class="memory-label"><b>${escape(labels[label])}</b><span>${queue.length} / ${record.capacity} retained</span></div><ol class="slots" aria-label="${escape(labels[label])} examples, oldest first">${slots}</ol></div>`;
  }

  function renderCheckpoint() {
    const run = getRun();
    const cp = checkpoints[checkpointId];
    const snapshot = record.checkpoints[checkpointId];
    const receipt = run.queries.find(query => query.checkpoint === checkpointId);
    const currentExamples = Object.values(snapshot.model).flatMap(model => model.queue.map(item => item.text_id));
    if (!currentExamples.includes(selectedText)) selectedText = currentExamples[0];
    document.querySelectorAll('[data-checkpoint]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.checkpoint === checkpointId)));
    const accepted = receipt && receipt.public_accepted === true;
    const status = accepted ? 'Recorded query · all active classes accepted' : 'Prepared reference · no completed query receipt';
    let queryHTML = `<p class="eyebrow">The same held-out issue</p><p class="query-text">“${escape(record.query_text)}”</p>`;
    if (accepted) {
      const checks = [];
      const laneCount = receipt.checks.compared_score_values ?? receipt.checks.compared_dot_values ?? receipt.checks.compared_kernel_values ?? receipt.checks.compared_lane_values;
      if (laneCount && (receipt.checks.every_score_lane_equal || receipt.checks.every_signed_dot_lane_equal || receipt.checks.every_dot_lane_equal || receipt.checks.every_kernel_lane_equal || receipt.checks.every_lane_equal)) checks.push(`${laneCount} returned lanes match the integer reference`);
      if (receipt.checks.exact_rational_ranking_equal) checks.push('Exact rational ranking matches');
      if (receipt.checks.restarted_process_same_model_and_every_lane === true) checks.push('New process, same model and every returned lane');
      checks.push(`${number(receipt.metrics.proofs_verified)} proofs independently verified before reading`);
      const rows = receipt.class_scores.map(score => `<tr><th scope="row">${escape(labels[score.label] || score.label)}</th><td>${number(score.mean_numerator)} / ${number(score.mean_denominator)}</td></tr>`).join('');
      queryHTML += `<p class="prediction"><span>Recorded answer</span>${escape(labels[receipt.prediction] || receipt.prediction)}</p><table class="score-table"><caption class="visually-hidden">Exact ${escape(run.score_label)} scores as numerator divided by active example count</caption><tbody>${rows}</tbody></table><ul class="checks">${checks.map(check => `<li>${escape(check)}</li>`).join('')}</ul><p class="checkpoint-description">${escape(run.score_label)} · ${seconds(receipt.worker_seconds)} for this complete query · ${bytes(receipt.metrics.proof_bytes)} of proof data.</p>`;
    } else {
      queryHTML += '<p class="checkpoint-description">This downloaded snapshot contains no completed encrypted query receipt for this checkpoint. The memory shown here comes from the fixed workload reference.</p>';
    }
    const event = checkpointId === 'after_expiry' ? 'Expired: <b>pi01</b> and <b>pi02</b>. New: <b>pi09</b> and <b>pi10</b>.' : escape(cp.description);
    document.getElementById('checkpoint').innerHTML = `<div class="checkpoint-heading"><h3>${escape(cp.title)}<span>revision ${snapshot.revision}</span></h3><p class="receipt-status${accepted ? '' : ' reference'}">${status}</p></div><div class="checkpoint-grid"><div class="memory"><div>${memoryRow('proof_integrity', snapshot, cp.fresh)}${memoryRow('runtime_performance', snapshot, cp.fresh)}</div><div class="memory-legend"><span>Retained example</span><span class="new">Added since previous checkpoint</span></div><p class="memory-event">${event}</p><div class="selected-example" id="selected-example"></div></div><div class="query-card">${queryHTML}</div></div>`;
    document.querySelectorAll('[data-text]').forEach(button => button.addEventListener('click', () => {
      selectedText = button.dataset.text;
      document.querySelectorAll('[data-text]').forEach(item => item.setAttribute('aria-pressed', String(item.dataset.text === selectedText)));
      renderText();
    }));
    renderText();
  }

  function renderText() {
    const example = record.texts.find(item => item.id === selectedText);
    document.getElementById('selected-example').innerHTML = `<p class="text-id">${escape(example.id)} / ${escape(labels[example.label])} / public teaching text</p><p>${escape(example.text)}</p>`;
  }

  function validateRecord(data) {
    if (data.schema !== 'keep-the-next-example-public-record-v1' || data.capacity !== 8 || !Array.isArray(data.runs) || data.runs.length === 0) throw new Error('Unsupported record');
    for (const run of data.runs) {
      if (!Array.isArray(run.queries) || !run.metrics || !Number.isFinite(run.worker_attempt_wall_seconds)) throw new Error('Missing measured run fields');
      if (!/^https:\/\/github\.com\/emberian\/zkml-research\//.test(run.source_url)) throw new Error('Unsupported source URL');
      for (const query of run.queries) {
        if (!Array.isArray(query.class_scores) || !Number.isFinite(query.worker_seconds)) throw new Error('Incomplete query receipt');
      }
    }
    for (const id of Object.keys(checkpoints)) if (!data.checkpoints[id]) throw new Error('Missing checkpoint');
  }

  fetch('public-record.json', { cache: 'no-cache' }).then(response => {
    if (!response.ok) throw new Error(`Record request failed: ${response.status}`);
    return response.json();
  }).then(data => {
    validateRecord(data);
    record = data;
    runId = record.default_run;
    if (!record.runs.some(run => run.id === runId)) runId = record.runs[0].id;
    const select = document.getElementById('engine');
    select.replaceChildren(...record.runs.map(run => {
      const option = document.createElement('option'); option.value = run.id; option.textContent = run.label; return option;
    }));
    select.value = runId;
    select.disabled = false;
    select.addEventListener('change', () => { runId = select.value; renderSummary(); });
    document.querySelectorAll('[data-checkpoint]').forEach(button => button.addEventListener('click', () => { checkpointId = button.dataset.checkpoint; renderCheckpoint(); }));
    document.querySelectorAll('[data-source]').forEach(link => { link.href = record.source_base + link.dataset.source; });
    renderSummary();
  }).catch(() => {
    document.getElementById('engine').replaceChildren(new Option('Record unavailable', ''));
    document.getElementById('checkpoint').innerHTML = '<p class="loading-message">The record could not be loaded. <a href="public-record.json">Open the data directly</a> or follow the evidence links below. No lifecycle result is inferred from a missing record.</p>';
  });
})();
