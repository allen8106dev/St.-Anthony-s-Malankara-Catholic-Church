"""Isolated test database setup. Never points automated tests at Supabase."""
from __future__ import annotations

import os
from pathlib import Path
import uuid

if os.environ.get("RUN_SUPABASE_INTEGRATION") != "1":
    os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")
    os.environ.setdefault("SECRET_KEY", "test-secret-not-for-production")
    os.environ.setdefault("ENVIRONMENT", "test")
    os.environ.setdefault("COOKIE_SECURE", "false")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.api.routes.auth import _attempts
from app.auth.security import hash_password
from app.db import session as db_session
from app.db.base import Base
import app.models  # noqa: F401
from app.main import app
from app.models.domain import AdminUser, Role, RoleName


@pytest.fixture()
def client():
    database_path = Path(__file__).parent / f".auth-test-{uuid.uuid4()}.db"
    engine = create_engine(f"sqlite+pysqlite:///{database_path}")
    test_session_local = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    Base.metadata.create_all(engine)
    original_engine, original_session_local = db_session.engine, db_session.SessionLocal
    db_session.engine, db_session.SessionLocal = engine, test_session_local
    _attempts.clear()
    try:
        with test_session_local() as db:
            roles = {name: Role(name=name, description=name.value) for name in RoleName}
            db.add_all(roles.values())
            db.add_all([
                AdminUser(email="super@example.test", name="Super", auth_subject="local:super", password_hash=hash_password("CorrectHorseBattery1"), role=roles[RoleName.SUPER_ADMIN], is_active=True),
                AdminUser(email="content@example.test", name="Content", auth_subject="local:content", password_hash=hash_password("CorrectHorseBattery1"), role=roles[RoleName.CONTENT_ADMIN], is_active=True),
                AdminUser(email="member@example.test", name="Member", auth_subject="local:member", password_hash=hash_password("CorrectHorseBattery1"), role=roles[RoleName.MEMBER_ADMIN], is_active=True),
                AdminUser(email="treasurer@example.test", name="Treasurer", auth_subject="local:treasurer", password_hash=hash_password("CorrectHorseBattery1"), role=roles[RoleName.TREASURER], is_active=True),
                AdminUser(email="inactive@example.test", name="Inactive", auth_subject="local:inactive", password_hash=hash_password("CorrectHorseBattery1"), role=roles[RoleName.CONTENT_ADMIN], is_active=False),
            ])
            db.commit()
        with TestClient(app) as test_client:
            yield test_client, test_session_local
    finally:
        _attempts.clear()
        db_session.engine, db_session.SessionLocal = original_engine, original_session_local
        engine.dispose()
        database_path.unlink(missing_ok=True)
