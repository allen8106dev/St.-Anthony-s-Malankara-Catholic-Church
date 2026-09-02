"""Controlled local/deployment bootstrap commands."""
import argparse
import getpass
import sys
import uuid
from sqlalchemy import select
from app.auth.security import hash_password
from app.auth.service import revoke_admin_sessions
from app.core.config import settings
from app.db.session import SessionLocal
from app.models.domain import AdminUser, Role, RoleName
from app.schemas.auth import normalize_email

def create_super_admin(email: str, name: str, password: str) -> None:
    email = normalize_email(email)
    if len(password) < 12: raise ValueError("Password must be at least 12 characters.")
    with SessionLocal() as db:
        if db.scalar(select(AdminUser.id).where(AdminUser.email == email)):
            raise ValueError("An administrator with that email already exists.")
        role = db.scalar(select(Role).where(Role.name == RoleName.SUPER_ADMIN))
        if not role:
            for role_name in RoleName:
                db.add(Role(name=role_name, description=role_name.value.replace("_", " ").title()))
            db.flush(); role = db.scalar(select(Role).where(Role.name == RoleName.SUPER_ADMIN))
        db.add(AdminUser(email=email, name=name.strip(), auth_subject=f"local:{uuid.uuid4()}", password_hash=hash_password(password), role=role, is_active=True))
        db.commit()


def reset_admin_password(email: str, password: str) -> None:
    """Reset an existing local administrator password in development only."""
    if settings.ENVIRONMENT.lower() != "development":
        raise ValueError("Password resets through this CLI are allowed only in development.")
    email = normalize_email(email)
    if len(password) < 12:
        raise ValueError("Password must be at least 12 characters.")
    with SessionLocal() as db:
        admin = db.scalar(select(AdminUser).where(AdminUser.email == email))
        if not admin:
            raise ValueError("No administrator with that email exists.")
        admin.password_hash = hash_password(password)
        revoke_admin_sessions(db, admin.id)
        db.commit()

def main() -> None:
    parser = argparse.ArgumentParser(); commands = parser.add_subparsers(dest="command", required=True)
    command = commands.add_parser("create-super-admin"); command.add_argument("--email", required=True); command.add_argument("--name", required=True)
    reset_command = commands.add_parser("reset-admin-password")
    reset_command.add_argument("--email", required=True)
    args = parser.parse_args()
    password = getpass.getpass("Password (minimum 12 characters): ")
    confirmation = getpass.getpass("Confirm password: ")
    if password != confirmation: raise SystemExit("Passwords do not match.")
    try:
        if args.command == "create-super-admin":
            create_super_admin(args.email, args.name, password)
        else:
            reset_admin_password(args.email, password)
    except ValueError as error: raise SystemExit(str(error)) from error
    print("Super Admin created." if args.command == "create-super-admin" else "Administrator password reset; existing sessions revoked.")

if __name__ == "__main__": main()
