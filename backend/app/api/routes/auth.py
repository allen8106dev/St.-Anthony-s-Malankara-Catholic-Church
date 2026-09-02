from collections import defaultdict, deque
from datetime import UTC, datetime
from time import monotonic
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from app.api.dependencies import CurrentAdmin, DbSession
from app.auth.security import password_needs_rehash, verify_password, hash_password
from app.auth.service import create_session, revoke_session
from app.core.config import settings
from app.models.domain import AdminUser
from app.schemas.auth import AdminUserRead, LoginRequest

router = APIRouter(prefix="/auth")
_attempts: dict[str, deque[float]] = defaultdict(deque)
_WINDOW_SECONDS, _MAX_ATTEMPTS = 60, 10

def _check_rate_limit(request: Request) -> None:
    key = request.client.host if request.client else "unknown"
    now = monotonic(); attempts = _attempts[key]
    while attempts and attempts[0] <= now - _WINDOW_SECONDS: attempts.popleft()
    if len(attempts) >= _MAX_ATTEMPTS:
        raise HTTPException(status_code=429, detail="Too many login attempts. Please try again later.")
    attempts.append(now)

def _read_admin(admin: AdminUser) -> AdminUserRead:
    return AdminUserRead(id=admin.id, email=admin.email, name=admin.name, role=admin.role.name)

@router.post("/login", response_model=AdminUserRead)
def login(data: LoginRequest, request: Request, response: Response, db: DbSession):
    _check_rate_limit(request)
    admin = db.scalar(select(AdminUser).where(AdminUser.email == data.email))
    if not admin or not admin.is_active or not admin.password_hash or not verify_password(data.password, admin.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")
    if password_needs_rehash(admin.password_hash): admin.password_hash = hash_password(data.password)
    admin.last_login_at = datetime.now(UTC)
    token = create_session(db, admin)
    db.commit()
    response.set_cookie(settings.SESSION_COOKIE_NAME, token, httponly=True, secure=settings.COOKIE_SECURE or settings.is_production, samesite="lax", max_age=settings.SESSION_EXPIRE_MINUTES * 60, path="/")
    return _read_admin(admin)

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(request: Request, response: Response, db: DbSession):
    revoke_session(db, request.cookies.get(settings.SESSION_COOKIE_NAME)); db.commit()
    response.delete_cookie(settings.SESSION_COOKIE_NAME, path="/")

@router.get("/me", response_model=AdminUserRead)
def me(admin: CurrentAdmin): return _read_admin(admin)
