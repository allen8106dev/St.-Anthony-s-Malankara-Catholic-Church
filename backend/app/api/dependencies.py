from typing import Annotated
from collections.abc import Callable
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.auth.permissions import Permission, has_permission
from app.auth.service import current_session
from app.core.config import settings
from app.models.domain import AdminUser, RoleName
DbSession = Annotated[Session, Depends(get_db)]

def get_current_admin(request: Request, db: DbSession) -> AdminUser:
    session = current_session(db, request.cookies.get(settings.SESSION_COOKIE_NAME))
    if not session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")
    return session.admin_user

CurrentAdmin = Annotated[AdminUser, Depends(get_current_admin)]

def require_permission(permission: Permission) -> Callable:
    def dependency(admin: CurrentAdmin) -> AdminUser:
        if not has_permission(admin.role.name, permission):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission for this action.")
        return admin
    return dependency

def require_role(role: RoleName) -> Callable:
    def dependency(admin: CurrentAdmin) -> AdminUser:
        if admin.role.name != role:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission for this action.")
        return admin
    return dependency
