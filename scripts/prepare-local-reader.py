"""Download verified free diagnostic resources inside this checkout; install nothing."""
from pathlib import Path
import hashlib
import json
import time
import urllib.request
import zipfile

root = Path(__file__).resolve().parents[1]
target = root / '.cache/local-reader'
target.mkdir(parents=True, exist_ok=True)
manifest = json.loads((root / 'scripts/local-reader-resources.json').read_text(encoding='utf-8'))

def digest(path):
    result = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(8 * 1024 * 1024), b''):
            result.update(chunk)
    return result.hexdigest()

for key in ['runtime', 'model']:
    item = manifest[key]
    path = target / item['filename']
    if path.exists() and path.stat().st_size == item['bytes'] and digest(path) == item['sha256']:
        print(f'Verified cached {item["name"]}', flush=True)
        continue
    partial = path.with_suffix(path.suffix + '.partial')
    count, last = 0, time.monotonic()
    print(f'Downloading {item["name"]}: {item["bytes"]:,} bytes. No paid API.', flush=True)
    with urllib.request.urlopen(item['url'], timeout=90) as source, partial.open('wb') as output:
        for chunk in iter(lambda: source.read(2 * 1024 * 1024), b''):
            output.write(chunk)
            count += len(chunk)
            if time.monotonic() - last > 10:
                print(f'{key}: {count:,}/{item["bytes"]:,} bytes', flush=True)
                last = time.monotonic()
    if count != item['bytes'] or digest(partial) != item['sha256']:
        raise ValueError(f'{key} size/hash mismatch; resource not used')
    partial.replace(path)
    print(f'Verified {item["name"]}', flush=True)

runtime = target / 'runtime'
runtime.mkdir(exist_ok=True)
with zipfile.ZipFile(target / manifest['runtime']['filename']) as archive:
    for member in archive.infolist():
        resolved = (runtime / member.filename).resolve()
        if not resolved.is_relative_to(runtime.resolve()) or member.external_attr >> 16 & 0o170000 == 0o120000:
            raise ValueError('Unsafe archive member')
    archive.extractall(runtime)
files = {str(path.relative_to(runtime)): digest(path) for path in runtime.rglob('*') if path.is_file()}
(target / 'runtime-hashes.json').write_text(json.dumps(files, indent=2), encoding='utf-8')
print('Ready inside .cache/local-reader. No service installed or started.', flush=True)
