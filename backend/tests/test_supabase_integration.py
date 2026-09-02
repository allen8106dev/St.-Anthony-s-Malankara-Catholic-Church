"""Explicitly gated real-database Phase 5 verification.

Run only with RUN_SUPABASE_INTEGRATION=1 after confirming the database is a
development database. All records created here are prefixed and removed in
the fixture cleanup.
"""
from __future__ import annotations

import os
import secrets
from datetime import UTC, datetime
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, select

if os.environ.get("RUN_SUPABASE_INTEGRATION") != "1":
    pytest.skip("Set RUN_SUPABASE_INTEGRATION=1 to run against Supabase.", allow_module_level=True)

from app.auth.security import hash_password
from app.db.session import SessionLocal
from app.main import app
from app.models.domain import (
    AdminSession,
    AdminUser,
    AuditLog,
    Donation,
    Due,
    DueStatus,
    Family,
    Member,
    Payment,
    PaymentMethod,
    PaymentStatus,
    Role,
    RoleName,
)


@pytest.fixture()
def supabase_test_data():
    suffix = secrets.token_hex(8)
    prefix = f"phase5-integration:{suffix}:"
    password = secrets.token_urlsafe(24)
    emails = {role: f"{role.value.lower()}.{suffix}@phase5-test.invalid" for role in RoleName}
    db = SessionLocal()
    try:
        roles = {role.name: role for role in db.scalars(select(Role))}
        assert set(roles) == set(RoleName)
        family = Family(family_name=f"PHASE5 INTEGRATION {suffix}")
        db.add(family)
        db.flush()
        member = Member(first_name="PHASE5", last_name=f"Integration {suffix}", membership_status="ACTIVE", family_id=family.id)
        db.add(member)
        db.flush()
        db.add_all([
            Due(member_id=member.id, title=f"PHASE5 INTEGRATION DUE {suffix}", amount=Decimal("1.00"), status=DueStatus.PENDING),
            Payment(member_id=member.id, amount=Decimal("1.00"), payment_date=datetime.now(UTC), payment_method=PaymentMethod.CASH, status=PaymentStatus.COMPLETED),
            Donation(donor_name=f"PHASE5 INTEGRATION {suffix}", amount=Decimal("1.00"), payment_status="PENDING", donated_at=datetime.now(UTC)),
        ])
        for role in RoleName:
            db.add(AdminUser(
                email=emails[role], name=f"PHASE5 {role.value}", auth_subject=prefix + role.value,
                password_hash=hash_password(password), role=roles[role], is_active=True,
            ))
        db.commit()
        yield {"suffix": suffix, "prefix": prefix, "password": password, "emails": emails}
    finally:
        db.rollback()
        users = list(db.scalars(select(AdminUser).where(AdminUser.auth_subject.like(prefix + "%"))))
        audit_users = list(db.scalars(select(AdminUser).where(AdminUser.email.like(f"audit.{suffix}@phase5-test.invalid"))))
        user_ids = [user.id for user in users + audit_users]
        if user_ids:
            db.execute(delete(AuditLog).where(AuditLog.admin_user_id.in_(user_ids)))
            db.execute(delete(AdminSession).where(AdminSession.admin_user_id.in_(user_ids)))
            db.execute(delete(AdminUser).where(AdminUser.id.in_(user_ids)))
        db.execute(delete(Payment).where(Payment.member.has(Member.last_name == f"Integration {suffix}")))
        db.execute(delete(Due).where(Due.title == f"PHASE5 INTEGRATION DUE {suffix}"))
        db.execute(delete(Donation).where(Donation.donor_name == f"PHASE5 INTEGRATION {suffix}"))
        db.execute(delete(Member).where(Member.last_name == f"Integration {suffix}"))
        db.execute(delete(Family).where(Family.family_name == f"PHASE5 INTEGRATION {suffix}"))
        db.commit()
        db.close()


def test_real_supabase_auth_and_private_route_matrix(supabase_test_data):
    client = TestClient(app)
    assert client.get("/api/v1/admin/members").status_code == 401

    missing = client.post("/api/v1/auth/login", json={"email": "missing@phase5-test.invalid", "password": "wrong"})
    wrong = client.post("/api/v1/auth/login", json={"email": supabase_test_data["emails"][RoleName.SUPER_ADMIN], "password": "wrong"})
    assert missing.status_code == wrong.status_code == 401
    assert missing.json()["detail"] == wrong.json()["detail"] == "Invalid email or password."

    permissions = {
        "members": {RoleName.SUPER_ADMIN, RoleName.MEMBER_ADMIN},
        "families": {RoleName.SUPER_ADMIN, RoleName.MEMBER_ADMIN},
        "dues": {RoleName.SUPER_ADMIN, RoleName.MEMBER_ADMIN, RoleName.TREASURER},
        "payments": {RoleName.SUPER_ADMIN, RoleName.TREASURER},
        "donations": {RoleName.SUPER_ADMIN, RoleName.TREASURER},
    }
    for role in RoleName:
        client.cookies.clear()
        response = client.post("/api/v1/auth/login", json={
            "email": supabase_test_data["emails"][role].upper(), "password": supabase_test_data["password"],
        })
        assert response.status_code == 200
        if role == RoleName.SUPER_ADMIN:
            cookie = response.headers["set-cookie"].lower()
            assert "httponly" in cookie and "samesite=lax" in cookie
            stale_token = client.cookies.get("church_admin_session")
            assert client.get("/api/v1/auth/me").status_code == 200
        for endpoint, allowed_roles in permissions.items():
            result = client.get(f"/api/v1/admin/{endpoint}")
            assert result.status_code == (200 if role in allowed_roles else 403)
            if role in allowed_roles:
                assert isinstance(result.json(), list)

    client.cookies.clear()
    assert client.post("/api/v1/auth/login", json={
        "email": supabase_test_data["emails"][RoleName.SUPER_ADMIN], "password": supabase_test_data["password"],
    }).status_code == 200
    created = client.post("/api/v1/admin/admin-users", json={
        "email": f"audit.{supabase_test_data['suffix']}@phase5-test.invalid",
        "name": "PHASE5 audit target", "password": secrets.token_urlsafe(24), "role": "CONTENT_ADMIN",
    })
    assert created.status_code == 201
    assert client.post("/api/v1/auth/logout").status_code == 204
    client.cookies.set("church_admin_session", stale_token)
    assert client.get("/api/v1/auth/me").status_code == 401

    with SessionLocal() as db:
        audit = db.scalar(select(AuditLog).where(AuditLog.action == "administrator.created").order_by(AuditLog.created_at.desc()))
        assert audit is not None
        assert "password" not in str(audit.metadata_json).lower()
        assert "token" not in str(audit.metadata_json).lower()
