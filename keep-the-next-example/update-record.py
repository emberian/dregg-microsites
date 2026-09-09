#!/usr/bin/env python3
"""Extract public lifecycle receipts without keys, local paths, or inferred success.

Run after the research owner has finished and committed the retained reports:
  python3 update-record.py --source-revision RESEARCH_COMMIT
Optional --baseline and --matched accept the actual lifecycle RESULT.json paths.
This reads only the declared workload/reference/result and public completed steps.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re

HERE = Path(__file__).resolve().parent


def read(path):
    return json.loads(path.read_text())


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--research-root', type=Path, default=Path('/Users/ember/dev/zkml-research'))
    parser.add_argument('--baseline', type=Path)
    parser.add_argument('--matched', type=Path)
    parser.add_argument('--source-revision', default='main')
    args = parser.parse_args()
    if not re.fullmatch(r'(?:main|[a-f0-9]{40})', args.source_revision):
        raise SystemExit('Source revision must be main or an exact 40-character commit.')
    lane = args.research_root / 'research/vfhe_2026_09_08'
    app = lane / 'continuing_system'
    workload_path, reference_path = app / 'workload.json', app / 'prepared/reference.json'
    workload, reference = read(workload_path), read(reference_path)
    source_base = f'https://github.com/emberian/zkml-research/blob/{args.source_revision}/research/vfhe_2026_09_08/'
    queries = [op for op in workload['operations'] if op['kind'] == 'query']
    checkpoint_data = {}
    for op in queries:
        expected = reference['operations'][op['id']]
        checkpoint_data[op['checkpoint']] = {k: expected[k] for k in ('revision', 'model')}
        checkpoint_data[op['checkpoint']]['claim'] = '[DERIVED] Fixed workload state; query acceptance comes only from a retained receipt.'
    runs = []
    matched_snapshot = app / 'results/linear-matched/RESULT.json'
    matched_default = matched_snapshot if matched_snapshot.is_file() else app / 'runtime/matched-lifecycle/resident.workload/RESULT.json'
    configs = [
        ('linear-matched', 'Linear score / matched BFV fields', 'Mean signed dot', args.matched or matched_default, 'evaluation-linear-matched.md'),
        ('squared-compact', 'Squared score / compact BabyBear', 'Mean squared dot', args.baseline or app / 'runtime/lifecycle/resident.workload/RESULT.json', 'evaluation.md'),
    ]
    for run_id, label, score_label, path, note in configs:
        result = read(path)
        public_relative = path.relative_to(app).as_posix() if path.is_relative_to(app / 'results') else note
        run = {
            'id': run_id, 'label': label, 'score_label': score_label,
            'claim': '[EXECUTED] Completed lifecycle operations and public query receipts, exactly as retained at the snapshot time.',
            'complete': result['complete'],
            'completed_operations': result['completed_operations'],
            'required_operations': result['required_operations'],
            'updated_utc': result['updated_utc'],
            'worker_attempt_wall_seconds': result['worker_attempt_wall_seconds'],
            'metrics': result['instance_cumulative_metrics'],
            'freshness_accounting': result['freshness_accounting'],
            'result_sha256': digest(path),
            'source_url': source_base + 'continuing_system/' + public_relative,
            'queries': [],
        }
        for query in result['queries']:
            completed_path = path.parent / 'steps' / query['id'] / 'completed.json'
            completed = read(completed_path)
            receipt = completed['worker']['result']
            if not receipt.get('answered') or not receipt.get('public_accepted'):
                raise SystemExit(f"Completed query lacks public acceptance: {query['id']}")
            run['queries'].append({
                'id': query['id'], 'checkpoint': query['checkpoint'],
                'revision': receipt['revision'], 'prediction': receipt['prediction'],
                'ranking': receipt['ranking'], 'class_scores': receipt['class_scores'],
                'public_accepted': receipt['public_accepted'], 'full_reader': receipt['full_reader'],
                'metrics': receipt['metrics'], 'checks': completed['checks'],
                'worker_seconds': completed['worker']['process']['elapsed_seconds'],
                'recorded_utc': completed['recorded_utc'],
                'completed_record_sha256': digest(completed_path),
            })
        runs.append(run)
    record = {
        'schema': 'keep-the-next-example-public-record-v1',
        'claim': '[EXECUTED + DERIVED] Recorded research data; this page performs no cryptographic computation.',
        'source_revision': args.source_revision, 'source_base': source_base,
        'default_run': next((run['id'] for run in runs if run['queries']), runs[0]['id']),
        'capacity': workload['capacity'],
        'corpus_provenance': workload['corpus_provenance'],
        'workload_sha256': digest(workload_path), 'reference_sha256': digest(reference_path),
        'query_text': next(text['text'] for text in workload['held_out'] if text['id'] == queries[0]['text_id']),
        'texts': workload['training'], 'checkpoints': checkpoint_data,
        'utility': {key: {k: v for k, v in value.items() if k != 'rows'} for key, value in reference['checkpoints'].items()},
        'utility_scope': reference['accuracy_scope'], 'runs': runs,
        'boundaries': ['Full BFV reader survives.', 'E5 encoder executes in plaintext at the issuer.', 'No whole-system post-quantum or operator-privacy claim.', 'Profiles differ in score and proof configuration; no numerical security equivalence is asserted.'],
    }
    output = HERE / 'public-record.json'
    output.write_text(json.dumps(record, indent=2) + '\n')
    print(json.dumps({'output': str(output), 'runs': [{'id': run['id'], 'complete': run['complete'], 'operations': run['completed_operations'], 'query_receipts': len(run['queries'])} for run in runs]}, indent=2))


if __name__ == '__main__':
    main()
