"""Server-side Supabase Storage integration for authenticated media uploads."""
import json
import urllib.error
import urllib.request
import uuid
from io import BytesIO

from PIL import Image
from fastapi import HTTPException, UploadFile

from app.core.config import settings

ALLOWED_TYPES = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif"}

async def upload_image(file: UploadFile) -> str:
    missing = [name for name, value in (
        ("SUPABASE_URL", settings.SUPABASE_URL),
        ("SUPABASE_SERVICE_ROLE_KEY", settings.SUPABASE_SERVICE_ROLE_KEY),
    ) if not value]
    if missing:
        raise HTTPException(503, f"Image storage is not configured. Set {', '.join(missing)} in the repository .env and restart the backend.")
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(415, "Only JPG, PNG, WebP, and GIF images are supported.")
    content = await file.read(settings.MAX_UPLOAD_BYTES + 1)
    if len(content) > settings.MAX_UPLOAD_BYTES:
        raise HTTPException(413, "Image must be 5 MB or smaller.")
    try:
        image = Image.open(BytesIO(content))
        image.verify()
    except Exception as exc:
        raise HTTPException(415, "The selected file is not a valid image.") from exc

    extension = ALLOWED_TYPES[file.content_type]
    path = f"announcements/{uuid.uuid4()}.{extension}"
    endpoint = f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/object/{settings.SUPABASE_STORAGE_BUCKET}/{path}"
    request = urllib.request.Request(endpoint, data=content, method="POST", headers={
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type": file.content_type,
        "x-upsert": "false",
    })
    try:
        with urllib.request.urlopen(request, timeout=30) as result:
            if result.status not in (200, 201):
                raise HTTPException(502, "Image storage rejected the upload.")
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        try:
            detail = json.loads(detail).get("message", detail)
        except json.JSONDecodeError:
            pass
        raise HTTPException(502, f"Image storage upload failed: {detail}") from exc
    except urllib.error.URLError as exc:
        raise HTTPException(502, "Image storage is unavailable.") from exc
    return f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/object/public/{settings.SUPABASE_STORAGE_BUCKET}/{path}"
