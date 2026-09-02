from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy import select

from app.auth.permissions import Permission, has_permission
from app.auth.service import token_digest
from app.models.domain import AdminSession, AdminUser, Role, RoleName

PASSWORD = "CorrectHorseBattery1"


def login(client, email: str = "super@example.test", password: str = PASSWORD):
    return client.post("/api/v1/auth/login", json={"email": email, "password": password})


def test_login_normalizes_email_and_uses_generic_failures(client):
    test_client, _ = client
    response = login(test_client, "  SUPER@EXAMPLE.TEST  ")
    assert response.status_code == 200
    assert response.json()["email"] == "super@example.test"
    unknown = login(test_client, "unknown@example.test", "wrong-password")
    incorrect = login(test_client, "super@example.test", "wrong-password")
    inactive = login(test_client, "inactive@example.test", PASSWORD)
    assert [item.status_code for item in (unknown, incorrect, inactive)] == [401, 401, 401]
    assert {item.json()["detail"] for item in (unknown, incorrect, inactive)} == {"Invalid email or password."}


def test_login_session_cookie_me_and_logout(client):
    test_client, session_local = client
    response = login(test_client)
    assert response.status_code == 200
    cookie = response.headers["set-cookie"].lower()
    assert "httponly" in cookie and "samesite=lax" in cookie and "secure" not in cookie
    token = test_client.cookies.get("church_admin_session")
    assert token
    with session_local() as db:
        session = db.scalar(select(AdminSession).where(AdminSession.token_hash == token_digest(token)))
        assert session is not None
        assert session.token_hash != token
    assert test_client.get("/api/v1/auth/me").status_code == 200
    assert "password_hash" not in response.text
    assert test_client.post("/api/v1/auth/logout").status_code == 204
    assert test_client.get("/api/v1/auth/me").status_code == 401
    test_client.cookies.set("church_admin_session", token)
    assert test_client.get("/api/v1/auth/me").status_code == 401


def test_unauthenticated_and_expired_sessions_are_rejected(client):
    test_client, session_local = client
    assert test_client.get("/api/v1/auth/me").status_code == 401
    login(test_client)
    token = test_client.cookies.get("church_admin_session")
    with session_local() as db:
        session = db.scalar(select(AdminSession).where(AdminSession.token_hash == token_digest(token)))
        session.expires_at = datetime.now(UTC) - timedelta(seconds=1)
        db.commit()
    assert test_client.get("/api/v1/auth/me").status_code == 401


def test_password_is_argon2_only_and_not_serialized(client):
    _, session_local = client
    with session_local() as db:
        admin = db.scalar(select(AdminUser).where(AdminUser.email == "super@example.test"))
        assert admin.password_hash.startswith("$argon2")
        assert PASSWORD not in admin.password_hash


@pytest.mark.parametrize("role,allowed", [
    (RoleName.SUPER_ADMIN, True),
    (RoleName.CONTENT_ADMIN, False),
    (RoleName.MEMBER_ADMIN, False),
    (RoleName.TREASURER, False),
])
def test_admin_user_endpoint_is_authorized_server_side(client, role, allowed):
    test_client, _ = client
    assert test_client.get("/api/v1/admin/admin-users").status_code == 401
    email = f"{role.value.lower().replace('_admin', '')}@example.test"
    assert login(test_client, email).status_code == 200
    response = test_client.get("/api/v1/admin/admin-users")
    assert response.status_code == (200 if allowed else 403)


def test_last_super_admin_protection_and_session_revocation(client):
    test_client, session_local = client
    login(test_client)
    with session_local() as db:
        super_admin = db.scalar(select(AdminUser).where(AdminUser.email == "super@example.test"))
        super_id = str(super_admin.id)
    assert test_client.patch(f"/api/v1/admin/admin-users/{super_id}", json={"is_active": False}).status_code == 409
    with session_local() as db:
        super_role = db.scalar(select(Role).where(Role.name == RoleName.SUPER_ADMIN))
        second = AdminUser(email="second@example.test", name="Second", auth_subject="local:second", password_hash="unused", role=super_role, is_active=True)
        db.add(second)
        db.commit()
    assert test_client.patch(f"/api/v1/admin/admin-users/{super_id}", json={"is_active": False}).status_code == 200
    assert test_client.get("/api/v1/auth/me").status_code == 401


def test_permission_matrix_and_public_endpoints(client):
    test_client, _ = client
    assert has_permission(RoleName.SUPER_ADMIN, Permission.SETTINGS_MANAGE)
    assert has_permission(RoleName.CONTENT_ADMIN, Permission.CONTENT_MANAGE)
    assert not has_permission(RoleName.CONTENT_ADMIN, Permission.MEMBERS_VIEW)
    assert has_permission(RoleName.MEMBER_ADMIN, Permission.MEMBERS_MANAGE)
    assert not has_permission(RoleName.MEMBER_ADMIN, Permission.PAYMENTS_VIEW)
    assert has_permission(RoleName.TREASURER, Permission.PAYMENTS_MANAGE)
    assert not has_permission(RoleName.TREASURER, Permission.MEMBERS_VIEW)
    for endpoint in ("events", "announcements", "gallery", "sermons", "content", "settings", "service-times"):
        assert test_client.get(f"/api/v1/public/{endpoint}").status_code == 200


@pytest.mark.parametrize("endpoint,allowed", [
    ("members", {RoleName.SUPER_ADMIN, RoleName.MEMBER_ADMIN}),
    ("families", {RoleName.SUPER_ADMIN, RoleName.MEMBER_ADMIN}),
    ("dues", {RoleName.SUPER_ADMIN, RoleName.MEMBER_ADMIN, RoleName.TREASURER}),
    ("payments", {RoleName.SUPER_ADMIN, RoleName.TREASURER}),
    ("donations", {RoleName.SUPER_ADMIN, RoleName.TREASURER}),
])
def test_private_domain_routes_enforce_role_matrix(client, endpoint, allowed):
    test_client, _ = client
    assert test_client.get(f"/api/v1/admin/{endpoint}").status_code == 401
    for role in RoleName:
        test_client.cookies.clear()
        email = f"{role.value.lower().replace('_admin', '')}@example.test"
        assert login(test_client, email).status_code == 200
        response = test_client.get(f"/api/v1/admin/{endpoint}")
        assert response.status_code == (200 if role in allowed else 403)


def test_login_rate_limit(client):
    test_client, _ = client
    for _ in range(10):
        assert login(test_client, "unknown@example.test", "wrong-password").status_code == 401
    assert login(test_client, "unknown@example.test", "wrong-password").status_code == 429
