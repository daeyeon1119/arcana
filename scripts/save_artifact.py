"""Replace generated artifacts only after their complete bytes are written."""
from pathlib import Path
import uuid

def save_bytes(path, data):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists() and path.read_bytes() == data:
        return
    temporary = path.with_name(path.name + '.' + uuid.uuid4().hex + '.tmp')
    try:
        temporary.write_bytes(data)
        temporary.replace(path)
    finally:
        temporary.unlink(missing_ok=True)

def save_text(path, text):
    save_bytes(path, text.encode('utf-8'))
