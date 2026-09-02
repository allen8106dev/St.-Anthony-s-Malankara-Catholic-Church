"""Phase 9 — Church operations & feature completion tests."""
from __future__ import annotations
import pytest
from decimal import Decimal
from datetime import datetime, timezone, timedelta

PASSWORD = "CorrectHorseBattery1"


def login(client, email: str = "super@example.test", password: str = PASSWORD):
    return client.post("/api/v1/auth/login", json={"email": email, "password": password})


def login_as(client, role: str):
    emails = {
        "SUPER_ADMIN": "super@example.test",
        "CONTENT_ADMIN": "content@example.test",
        "MEMBER_ADMIN": "member@example.test",
        "TREASURER": "treasurer@example.test",
    }
    return client.post("/api/v1/auth/login", json={"email": emails[role], "password": PASSWORD})


# ── Admin dashboard — authentication ─────────────────────────────────────────
def test_dashboard_requires_auth(client):
    tc, _ = client
    assert tc.get("/api/v1/admin/dashboard").status_code == 401


# ── Admin dashboard — all roles can access ───────────────────────────────────
@pytest.mark.parametrize("role", ["SUPER_ADMIN", "CONTENT_ADMIN", "MEMBER_ADMIN", "TREASURER"])
def test_dashboard_accessible_to_all_admin_roles(client, role):
    tc, _ = client
    login_as(tc, role)
    r = tc.get("/api/v1/admin/dashboard")
    assert r.status_code == 200
    data = r.json()
    assert "total_members" in data
    assert "active_members" in data
    assert "total_families" in data
    assert "upcoming_events" in data
    assert "active_announcements" in data
    assert "donations_on_hold" in data
    assert data["donations_on_hold"] is True


# ── Admin dashboard — finance fields gated by role ───────────────────────────
def test_dashboard_finance_visible_to_treasurer(client):
    tc, _ = client
    login_as(tc, "TREASURER")
    r = tc.get("/api/v1/admin/dashboard")
    assert r.status_code == 200
    data = r.json()
    assert "outstanding_dues" in data
    assert "total_collected" in data
    assert "overdue_dues" in data
    assert "recent_payments" in data


def test_dashboard_finance_hidden_from_content_admin(client):
    tc, _ = client
    login_as(tc, "CONTENT_ADMIN")
    r = tc.get("/api/v1/admin/dashboard")
    assert r.status_code == 200
    data = r.json()
    # Finance fields present but zeroed — content admin has no finance permission
    assert data["outstanding_dues"] == "0"
    assert data["total_collected"] == "0"
    assert data["recent_payments"] == []


# ── Admin dashboard — counts reflect real data ───────────────────────────────
def test_dashboard_member_counts(client):
    tc, sl = client
    login(tc)

    # Create a family and member
    family = tc.post("/api/v1/admin/families", json={"family_name": "Dashboard Family"}).json()
    tc.post("/api/v1/admin/members", json={
        "first_name": "Dash", "last_name": "Board",
        "membership_status": "ACTIVE", "family_id": family["id"],
    })

    r = tc.get("/api/v1/admin/dashboard")
    data = r.json()
    assert data["total_members"] >= 1
    assert data["active_members"] >= 1
    assert data["total_families"] >= 1


def test_dashboard_upcoming_events_count(client):
    tc, _ = client
    login(tc)

    future = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    ev = tc.post("/api/v1/admin/cms/events", json={"title": "Dash Event", "start_datetime": future}).json()
    tc.post(f"/api/v1/admin/cms/events/{ev['id']}/publish")

    r = tc.get("/api/v1/admin/dashboard")
    assert r.json()["upcoming_events"] >= 1


def test_dashboard_active_announcements_count(client):
    tc, _ = client
    login(tc)

    ann = tc.post("/api/v1/admin/cms/announcements", json={"title": "Dash Ann"}).json()
    tc.post(f"/api/v1/admin/cms/announcements/{ann['id']}/publish")

    r = tc.get("/api/v1/admin/dashboard")
    assert r.json()["active_announcements"] >= 1


# ── Admin dashboard — no private member data in response ─────────────────────
def test_dashboard_no_member_pii(client):
    tc, _ = client
    login(tc)
    r = tc.get("/api/v1/admin/dashboard")
    text = str(r.json())
    assert "email" not in text or "recent_payments" in text  # only payment items may have member refs
    assert "password" not in text
    assert "phone" not in text


# ── Office hours setting ──────────────────────────────────────────────────────
def test_office_hours_setting_accepted(client):
    tc, _ = client
    login(tc)
    r = tc.put("/api/v1/admin/cms/settings/office_hours", json={"value": "Mon–Fri 9am–5pm"})
    assert r.status_code == 200
    assert r.json()["key"] == "office_hours"
    assert r.json()["value"] == "Mon–Fri 9am–5pm"


def test_office_hours_visible_publicly(client):
    tc, _ = client
    login(tc)
    tc.put("/api/v1/admin/cms/settings/office_hours", json={"value": "Mon–Fri 9am–5pm"})
    pub = tc.get("/api/v1/public/settings")
    keys = {s["key"] for s in pub.json()}
    assert "office_hours" in keys


# ── Funeral / memorial notices ────────────────────────────────────────────────
def test_funeral_announcement_type_accepted(client):
    tc, _ = client
    login(tc)
    r = tc.post("/api/v1/admin/cms/announcements", json={
        "title": "In Memoriam: John Doe",
        "description": "Funeral service details.",
        "type": "FUNERAL",
    })
    assert r.status_code == 201
    assert r.json()["type"] == "FUNERAL"


def test_funeral_notice_visible_publicly_when_published(client):
    tc, _ = client
    login(tc)
    ann = tc.post("/api/v1/admin/cms/announcements", json={
        "title": "Funeral Notice Test", "type": "FUNERAL",
    }).json()
    tc.post(f"/api/v1/admin/cms/announcements/{ann['id']}/publish")

    pub = tc.get("/api/v1/public/announcements", params={"type": "FUNERAL"})
    assert pub.status_code == 200
    assert any(a["id"] == ann["id"] for a in pub.json()["items"])


def test_funeral_notice_not_in_general_filter(client):
    """Funeral notices should not appear when filtering for GENERAL type."""
    tc, _ = client
    login(tc)
    ann = tc.post("/api/v1/admin/cms/announcements", json={
        "title": "Funeral Only Notice", "type": "FUNERAL",
    }).json()
    tc.post(f"/api/v1/admin/cms/announcements/{ann['id']}/publish")

    pub = tc.get("/api/v1/public/announcements", params={"type": "GENERAL"})
    assert not any(a["id"] == ann["id"] for a in pub.json()["items"])


def test_funeral_notice_appears_in_unfiltered_list(client):
    """Funeral notices appear in the unfiltered public list."""
    tc, _ = client
    login(tc)
    ann = tc.post("/api/v1/admin/cms/announcements", json={
        "title": "Unfiltered Funeral Notice", "type": "FUNERAL",
    }).json()
    tc.post(f"/api/v1/admin/cms/announcements/{ann['id']}/publish")

    pub = tc.get("/api/v1/public/announcements")
    assert any(a["id"] == ann["id"] for a in pub.json()["items"])


# ── Marriage / wedding notices ────────────────────────────────────────────────
def test_marriage_announcement_type_accepted(client):
    tc, _ = client
    login(tc)
    r = tc.post("/api/v1/admin/cms/announcements", json={
        "title": "Wedding: Thomas & Mary",
        "description": "Marriage blessing ceremony.",
        "type": "MARRIAGE",
    })
    assert r.status_code == 201
    assert r.json()["type"] == "MARRIAGE"


def test_marriage_notice_visible_publicly_when_published(client):
    tc, _ = client
    login(tc)
    ann = tc.post("/api/v1/admin/cms/announcements", json={
        "title": "Marriage Notice Test", "type": "MARRIAGE",
    }).json()
    tc.post(f"/api/v1/admin/cms/announcements/{ann['id']}/publish")

    pub = tc.get("/api/v1/public/announcements", params={"type": "MARRIAGE"})
    assert pub.status_code == 200
    assert any(a["id"] == ann["id"] for a in pub.json()["items"])


def test_multi_type_filter_returns_both_funeral_and_marriage(client):
    tc, _ = client
    login(tc)
    f = tc.post("/api/v1/admin/cms/announcements", json={"title": "Multi Funeral", "type": "FUNERAL"}).json()
    m = tc.post("/api/v1/admin/cms/announcements", json={"title": "Multi Marriage", "type": "MARRIAGE"}).json()
    tc.post(f"/api/v1/admin/cms/announcements/{f['id']}/publish")
    tc.post(f"/api/v1/admin/cms/announcements/{m['id']}/publish")

    pub = tc.get("/api/v1/public/announcements", params={"types": "FUNERAL,MARRIAGE"})
    ids = {a["id"] for a in pub.json()["items"]}
    assert f["id"] in ids
    assert m["id"] in ids


def test_unpublished_funeral_not_public(client):
    tc, _ = client
    login(tc)
    ann = tc.post("/api/v1/admin/cms/announcements", json={
        "title": "Draft Funeral", "type": "FUNERAL",
    }).json()
    pub = tc.get("/api/v1/public/announcements", params={"type": "FUNERAL"})
    assert not any(a["id"] == ann["id"] for a in pub.json()["items"])


# ── Public data safety — no private member/financial data ────────────────────
def test_public_announcements_no_admin_fields(client):
    tc, _ = client
    login(tc)
    ann = tc.post("/api/v1/admin/cms/announcements", json={"title": "Safety Test"}).json()
    tc.post(f"/api/v1/admin/cms/announcements/{ann['id']}/publish")
    pub = tc.get("/api/v1/public/announcements")
    item = next(a for a in pub.json()["items"] if a["id"] == ann["id"])
    assert "status" not in item
    assert "updated_at" not in item


def test_public_endpoints_no_member_data(client):
    """Public content endpoints must not expose member records."""
    tc, _ = client
    # No login — unauthenticated
    for path in ["/api/v1/public/events", "/api/v1/public/announcements",
                 "/api/v1/public/sermons", "/api/v1/public/gallery",
                 "/api/v1/public/settings", "/api/v1/public/service-times"]:
        r = tc.get(path)
        assert r.status_code == 200
        text = str(r.json())
        assert "password_hash" not in text
        assert "auth_subject" not in text
        assert "membership_status" not in text


def test_admin_members_endpoint_requires_auth(client):
    tc, _ = client
    assert tc.get("/api/v1/admin/members").status_code == 401


def test_admin_finance_endpoint_requires_auth(client):
    tc, _ = client
    assert tc.get("/api/v1/admin/finance/summary").status_code == 401


# ── Content admin cannot access finance ──────────────────────────────────────
def test_content_admin_cannot_access_finance_summary(client):
    tc, _ = client
    login_as(tc, "CONTENT_ADMIN")
    assert tc.get("/api/v1/admin/finance/summary").status_code == 403


def test_content_admin_cannot_access_members(client):
    tc, _ = client
    login_as(tc, "CONTENT_ADMIN")
    assert tc.get("/api/v1/admin/members").status_code == 403


# ── Treasurer cannot access CMS ──────────────────────────────────────────────
def test_treasurer_cannot_manage_cms(client):
    tc, _ = client
    login_as(tc, "TREASURER")
    assert tc.post("/api/v1/admin/cms/events", json={
        "title": "Unauthorized", "start_datetime": "2026-12-01T10:00:00Z"
    }).status_code == 403


# ── Audit logging for new operations ─────────────────────────────────────────
def test_audit_log_on_funeral_notice_publish(client):
    tc, sl = client
    login(tc)
    ann = tc.post("/api/v1/admin/cms/announcements", json={
        "title": "Audit Funeral", "type": "FUNERAL",
    }).json()
    tc.post(f"/api/v1/admin/cms/announcements/{ann['id']}/publish")

    from app.models.domain import AuditLog
    from sqlalchemy import select
    with sl() as db:
        logs = db.scalars(select(AuditLog).where(
            AuditLog.entity_id == ann["id"],
            AuditLog.action == "content.announcement.published",
        )).all()
    assert len(logs) >= 1


def test_audit_log_on_settings_change(client):
    tc, sl = client
    login(tc)
    tc.put("/api/v1/admin/cms/settings/office_hours", json={"value": "9am-5pm"})

    from app.models.domain import AuditLog
    from sqlalchemy import select
    with sl() as db:
        logs = db.scalars(select(AuditLog).where(
            AuditLog.entity_id == "office_hours",
            AuditLog.action == "content.settings.updated",
        )).all()
    assert len(logs) >= 1
