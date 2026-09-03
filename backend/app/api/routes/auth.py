from collections import defaultdict, deque
from datetime import UTC, datetime
from time import monotonic
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from secrets import token_urlsafe
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
_oauth_states: set[str] = set()
oauth = OAuth()
if settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET:
    oauth.register("google", client_id=settings.GOOGLE_CLIENT_ID, client_secret=settings.GOOGLE_CLIENT_SECRET, server_metadata_url="https://accounts.google.com/.well-known/openid-configuration", client_kwargs={"scope": "openid email profile"})

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
    response.set_cookie(settings.SESSION_COOKIE_NAME, token, httponly=True, secure=settings.cookie_secure, samesite=settings.cookie_samesite, max_age=settings.SESSION_EXPIRE_MINUTES * 60, path="/")
    return _read_admin(admin)

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(request: Request, response: Response, db: DbSession):
    revoke_session(db, request.cookies.get(settings.SESSION_COOKIE_NAME)); db.commit()
    response.delete_cookie(settings.SESSION_COOKIE_NAME, path="/", httponly=True, secure=settings.cookie_secure, samesite=settings.cookie_samesite)

@router.get("/me", response_model=AdminUserRead)
def me(admin: CurrentAdmin): return _read_admin(admin)

@router.get("/google/login")
async def google_login(request: Request):
    if not oauth.google:
        raise HTTPException(503, "Google sign-in is not configured.")
    state = token_urlsafe(32)
    _oauth_states.add(state)
    return await oauth.google.authorize_redirect(request, settings.GOOGLE_REDIRECT_URI, state=state)

@router.get("/google/callback")
async def google_callback(request: Request, response: Response, db: DbSession):
    state = request.query_params.get("state")
    if not state or state not in _oauth_states:
        raise HTTPException(400, "Invalid OAuth state.")
    _oauth_states.remove(state)
    try:
        token = await oauth.google.authorize_access_token(request)
        claims = token.get("userinfo") or await oauth.google.parse_id_token(request, token)
        subject = claims.get("sub") if claims else None
    except Exception as exc:
        raise HTTPException(401, "Google sign-in could not be verified.") from exc
    admin = db.scalar(select(AdminUser).where(AdminUser.auth_subject == f"google:{subject}", AdminUser.is_active.is_(True))) if subject else None
    if not admin:
        raise HTTPException(403, "This Google account is not authorized for administration.")
    admin.last_login_at = datetime.now(UTC)
    session_token = create_session(db, admin)
    db.commit()
    redirect = RedirectResponse(f"{settings.FRONTEND_URL.rstrip('/')}/admin", status_code=303)
    redirect.set_cookie(settings.SESSION_COOKIE_NAME, session_token, httponly=True, secure=settings.cookie_secure, samesite=settings.cookie_samesite, max_age=settings.SESSION_EXPIRE_MINUTES * 60, path="/")
    return redirect
