"""Fetch unchanged original 1909 RWS scans and record Wikimedia provenance/hashes."""
import concurrent.futures
import hashlib
import json
import re
import time
import urllib.parse
import urllib.request
import urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/rws'
AGENT = 'ArcanaOriginalCardAssets/1.0 (https://github.com/daeyeon1119/arcana)'
CATEGORY = 'Category:Rider-Waite tarot deck (Roses & Lilies)'

def fetch(url):
    for attempt in range(4):
        try:
            time.sleep(3)
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': AGENT}), timeout=45) as response:
                return response.read()
        except urllib.error.HTTPError as error:
            if error.code == 429:
                delay = max(30, min(60, int(error.headers.get('Retry-After','30'))))
                print(f'Wikimedia rate limit: waiting {delay}s before retry', flush=True)
                time.sleep(delay)
            if attempt == 3:
                raise
        except Exception:
            if attempt == 3:
                raise
            time.sleep(attempt + 1)

def main():
    params = {'action':'query','format':'json','generator':'categorymembers','gcmtitle':CATEGORY,
              'gcmnamespace':6,'gcmlimit':100,'prop':'imageinfo','iiprop':'url|size|sha1|extmetadata'}
    cache = ROOT / '.cache/rws-category.json'
    if cache.exists():
        data = json.loads(cache.read_text(encoding='utf-8'))
    else:
        data = json.loads(fetch('https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode(params)))
        cache.parent.mkdir(parents=True, exist_ok=True)
        cache.write_text(json.dumps(data), encoding='utf-8')
    assert 'continue' not in data, 'Unexpected category pagination'
    rows = []
    for page in data['query']['pages'].values():
        match = re.fullmatch(r'File:RWS1909 - (?:(\d{2}) (.+)|(Cups|Wands|Swords|Pentacles) (\d{2}))\.jpeg', page['title'])
        if not match:
            continue
        major, name, suit, minor = match.groups()
        card_id = 'ar'+major if major else {'Cups':'cu','Wands':'wa','Swords':'sw','Pentacles':'pe'}[suit]+minor
        info = page['imageinfo'][0]
        meta = info['extmetadata']
        assert meta['LicenseShortName']['value'] == 'Public domain', page['title']
        assert meta['DateTimeOriginal']['value'] == '1909', page['title']
        rows.append({'id':card_id,'filename':page['title'][5:], 'sourcePage':info['descriptionurl'],
                     'url':info['url'].split('?')[0], 'sha1':info['sha1'], 'width':info['width'],
                     'height':info['height'],'license':'Public domain','licenseURL':'https://creativecommons.org/publicdomain/mark/1.0/'})
    expected = {f'ar{n:02}' for n in range(22)} | {f'{s}{n:02}' for s in ['cu','wa','sw','pe'] for n in range(1,15)}
    assert {r['id'] for r in rows} == expected and len(rows) == 78
    OUT.mkdir(parents=True, exist_ok=True)
    def download(row):
        path = OUT / (row['id']+'.jpg')
        raw = path.read_bytes() if path.exists() else fetch(row['url'])
        assert raw[:3] == b'\xff\xd8\xff' and len(raw)>100000, row['id']
        assert hashlib.sha1(raw).hexdigest() == row['sha1'], row['id']
        row.update(sha256=hashlib.sha256(raw).hexdigest(),bytes=len(raw))
        path.write_bytes(raw)
        return row
    done = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
        for row in pool.map(download, sorted(rows, key=lambda r:r['id'])):
            done.append(row)
            if len(done)%10 == 0 or len(done)==78:
                print(f'Verified original scans: {len(done)}/78', flush=True)
    manifest = {'edition':'Rider–Waite–Smith, original 1909 Roses & Lilies',
                'artist':'Pamela Colman Smith','scanCredit':'Saskia Jansen',
                'sourceCategory':'https://commons.wikimedia.org/wiki/Category:Rider-Waite_tarot_deck_(Roses_%26_Lilies)',
                'transformation':'None: original JPEG bytes, no resize, recolor or redrawing.', 'cards':done}
    (OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n', encoding='utf-8', newline='\n')
    print(f"Saved 78 original scans: {sum(r['bytes'] for r in done):,} bytes", flush=True)

if __name__ == '__main__':
    main()
