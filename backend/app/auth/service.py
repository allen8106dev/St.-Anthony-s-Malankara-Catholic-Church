import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.domain import AdminSession, AdminUser

def token_digest(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()

def _utc(value: datetime) -> datetime:
    """Keep session expiry checks safe with database drivers lacking tz support."""
    return value if value.tzinfo is not None else value.replace(tzinfo=UTC)

def create_session(db: Session, admin: AdminUser) -> str:
    token = secrets.token_urlsafe(32)
    db.add(AdminSession(admin_user_id=admin.id, token_hash=token_digest(token), expires_at=datetime.now(UTC) + timedelta(minutes=settings.SESSION_EXPIRE_MINUTES)))
    return token

def current_session(db: Session, token: str | None) -> AdminSession | None:
    if not token:
        return None
    session = db.scalar(select(AdminSession).where(AdminSession.token_hash == token_digest(token)))
    if not session or session.revoked_at or _utc(session.expires_at) <= datetime.now(UTC) or not session.admin_user.is_active:
        return None
    return session

def revoke_session(db: Session, token: str | None) -> None:
    session = current_session(db, token)
    if session:
        session.revoked_at = datetime.now(UTC)

def revoke_admin_sessions(db: Session, admin_id) -> None:
    now = datetime.now(UTC)
    for session in db.scalars(select(AdminSession).where(AdminSession.admin_user_id == admin_id, AdminSession.revoked_at.is_(None))):
        session.revoked_at = now
