from sqlalchemy import select

from app import cli
from app.auth.security import verify_password
from app.auth.service import create_session, current_session
from app.models.domain import AdminUser


def test_reset_admin_password_updates_existing_user_and_revokes_sessions(client, monkeypatch):
    _, session_local = client
    monkeypatch.setattr(cli, "SessionLocal", session_local)
    monkeypatch.setattr(cli.settings, "ENVIRONMENT", "development")
    with session_local() as db:
        admin = db.scalar(select(AdminUser).where(AdminUser.email == "super@example.test"))
        token = create_session(db, admin)
        db.commit()

    cli.reset_admin_password("  SUPER@EXAMPLE.TEST  ", "NewCorrectHorseBattery2")

    with session_local() as db:
        admin = db.scalar(select(AdminUser).where(AdminUser.email == "super@example.test"))
        assert admin.is_active is True
        assert verify_password("NewCorrectHorseBattery2", admin.password_hash)
        assert current_session(db, token) is None


def test_reset_admin_password_is_development_only(client, monkeypatch):
    _, session_local = client
    monkeypatch.setattr(cli, "SessionLocal", session_local)
    monkeypatch.setattr(cli.settings, "ENVIRONMENT", "production")

    try:
        cli.reset_admin_password("super@example.test", "NewCorrectHorseBattery2")
    except ValueError as error:
        assert "development" in str(error)
    else:
        raise AssertionError("Expected the reset command to reject non-development environments")
