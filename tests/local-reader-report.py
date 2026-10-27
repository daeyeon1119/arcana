"""Report integrity checks with explicitly synthetic records in a temporary mini repository."""
from pathlib import Path
import hashlib
import json
import shutil
import subprocess
import sys
import tempfile

root = Path(__file__).resolve().parents[1]
checks = []
cache = root / '.cache'
cache.mkdir(exist_ok=True)
with tempfile.TemporaryDirectory(prefix='report-check-', dir=cache) as directory:
    temp = Path(directory)
    assert temp.resolve().is_relative_to(cache.resolve())
    for folder in ['scripts', 'tests', 'test-results/local-reader/native-qwen35-9b-first/report-check']:
        (temp / folder).mkdir(parents=True, exist_ok=True)
    shutil.copy(root / 'scripts/local_reader_report.py', temp / 'scripts/local_reader_report.py')
    shutil.copy(root / 'scripts/local-reader-profiles.json', temp / 'scripts/local-reader-profiles.json')
    fixture = {'cases': [{'id': name, 'kind': 'fresh', 'question': 'TEST ONLY <질문>', 'review': 'TEST ONLY'} for name in ['x01', 'x02']]}
    fixture_path = temp / 'tests/report-check.json'
    fixture_path.write_text(json.dumps(fixture, ensure_ascii=False), encoding='utf-8', newline='\n')
    output = temp / 'test-results/local-reader/native-qwen35-9b-first/report-check'
    freeze = {'fixtureSHA256': hashlib.sha256(fixture_path.read_bytes()).hexdigest(), 'model': {'name': 'TEST ONLY MODEL'}, 'selectedCaseIds': ['x01', 'x02']}
    save = lambda path, value: path.write_text(json.dumps(value, ensure_ascii=False), encoding='utf-8')
    save(output / 'freeze.json', freeze)
    save(output / 'x01.json', {'elapsedMs': 1, 'packet': {'cards': []}, 'baseline': {'direct': 'TEST ONLY'}, 'raw': 'TEST ONLY', 'parsed': {}, 'validation': {'ok': False, 'issues': ['TEST ONLY']}})
    command = [sys.executable, '-X', 'utf8', str(temp / 'scripts/local_reader_report.py'), '--profile=qwen35-9b', '--fixture=tests/report-check.json', '--run=report-check']
    def run():
        return subprocess.run(command, text=True, encoding='utf-8', capture_output=True, cwd=temp)
    result = run()
    assert result.returncode == 0, result.stderr
    report = (output / 'review.html').read_text(encoding='utf-8')
    assert 'TEST ONLY MODEL' in report and 'TEST ONLY &lt;질문&gt;' in report
    checks.append('frozen model and escaped question are shown')
    assert '실행 기록 1/2개' in report and '답변 생성 1개' in report and '실제 문장 검토 0개' in report and '아직 실행 결과 없음' in report
    checks.append('missing output and absent reviews are not counted as complete')
    assert '별도 작성 질문 2개' in report and '새 상황 12개' not in report and '통신 장애' not in report
    checks.append('custom fixture counts and development run label are accurate')
    save(output / 'review-notes.json', {'x01': {'comment': 'TEST ONLY', 'reviewScope': 'question-plan-only'}})
    assert run().returncode == 0
    assert '실제 문장 검토 0개' in (output / 'review.html').read_text(encoding='utf-8')
    checks.append('plan-only review is not counted as answer review')
    freeze['caseLimit'] = 1
    save(output / 'freeze.json', freeze)
    assert run().returncode == 0
    assert '실행 기록 1/1개' in (output / 'review.html').read_text(encoding='utf-8')
    checks.append('frozen case limit is reflected in report denominator')
    fixture_path.write_text(fixture_path.read_text(encoding='utf-8') + ' ', encoding='utf-8')
    assert run().returncode != 0
    checks.append('changed fixture cannot be reported against an earlier freeze')
    fixture_path.write_text(fixture_path.read_text(encoding='utf-8')[:-1], encoding='utf-8')
    freeze['selectedCaseIds'] = ['missing']
    save(output / 'freeze.json', freeze)
    assert run().returncode != 0
    checks.append('unknown frozen case cannot silently produce an empty report')
    output = temp / 'test-results/local-reader/native-qwen35-9b-separated-first/report-check'
    output.mkdir(parents=True)
    freeze['selectedCaseIds'] = ['x01']
    save(output / 'freeze.json', freeze)
    command.append('--separated')
    draft = {'requests': [{'source': 'TEST ONLY', 'answer': 'TEST ONLY 질문 도움'}], 'actions': ['TEST ONLY 실천'], 'unknowns': []}
    save(output / 'x01.draft.json', {'draftRaw': 'TEST ONLY DRAFT', 'draft': draft})
    assert run().returncode == 0
    report = (output / 'review.html').read_text(encoding='utf-8')
    assert '실행 기록 0/1개' in report and '답변 생성 0개' in report and '초안 수신 1개' in report and '전체 해석 미완료' in report and 'TEST ONLY 질문 도움' in report
    checks.append('persisted first draft is visible without counting a complete reading')
    row = {'elapsedMs': 1, 'packet': {'cards': [{'ref': 'c0','position': 'TEST ONLY 위치','name': 'TEST ONLY 카드','orientation': '정방향','meaning': 'TEST ONLY 의미'}]}, 'baseline': {'direct':'TEST ONLY'}, 'raw':'TEST ONLY SYMBOLS', 'draft':draft, 'draftRaw':'TEST ONLY DRAFT', 'parsed':{'synthesis':{'connection':'TEST ONLY 연결','invitation':'TEST ONLY 통합 관점'}, 'cards':{'c0':{'lens':'TEST ONLY 카드 렌즈','invitation':'TEST ONLY 카드 관점'}}}, 'validation':{'ok':False,'issues':['TEST ONLY']}}
    save(output / 'x01.json', row)
    save(output / 'review-notes.json', {'x01':{'comment':'TEST ONLY','reviewScope':'question-help-only'}})
    assert run().returncode == 0
    report = (output / 'review.html').read_text(encoding='utf-8')
    assert '답변 생성 1개' in report and '실제 문장 검토 0개' in report and '<p>TEST ONLY 질문 도움</p>' in report and '<p>TEST ONLY 카드 렌즈<br>TEST ONLY 카드 관점</p>' in report
    checks.append('separated answer/card fields render separately and draft-only review remains partial')
print(json.dumps({'total': len(checks), 'checks': checks, 'note': 'Synthetic TEST ONLY records; no model or expert evaluation.'}, ensure_ascii=False))
