"""Phase 7 — CMS content management tests."""
from __future__ import annotations
import pytest
from datetime import datetime, timezone, timedelta
from app.models.domain import (
    Event, EventStatus, Announcement, PublicationStatus, GalleryAlbum,
    GalleryImage, Sermon, ServiceTime, PageContent, SiteSetting, RoleName,
)

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


# ── Authentication boundary ───────────────────────────────────────────────────
def test_cms_requires_authentication(client):
    tc, _ = client
    assert tc.get("/api/v1/admin/cms/dashboard").status_code == 401
    assert tc.get("/api/v1/admin/cms/events").status_code == 401
    assert tc.get("/api/v1/admin/cms/announcements").status_code == 401
    assert tc.get("/api/v1/admin/cms/sermons").status_code == 401
    assert tc.get("/api/v1/admin/cms/gallery").status_code == 401
    assert tc.get("/api/v1/admin/cms/service-times").status_code == 401
    assert tc.get("/api/v1/admin/cms/settings").status_code == 401


# ── Permission matrix ─────────────────────────────────────────────────────────
@pytest.mark.parametrize("role,allowed", [
    ("SUPER_ADMIN", True),
    ("CONTENT_ADMIN", True),
    ("MEMBER_ADMIN", False),
    ("TREASURER", False),
])
def test_cms_permission_matrix(client, role, allowed):
    tc, _ = client
    login_as(tc, role)
    r = tc.get("/api/v1/admin/cms/dashboard")
    assert r.status_code == (200 if allowed else 403)


@pytest.mark.parametrize("role,allowed", [
    ("SUPER_ADMIN", True),
    ("CONTENT_ADMIN", True),
    ("MEMBER_ADMIN", False),
    ("TREASURER", False),
])
def test_cms_event_create_permission(client, role, allowed):
    tc, _ = client
    login_as(tc, role)
    payload = {"title": "Test Event", "start_datetime": "2026-12-01T10:00:00Z"}
    r = tc.post("/api/v1/admin/cms/events", json=payload)
    assert r.status_code == (201 if allowed else 403)


# ── Dashboard ─────────────────────────────────────────────────────────────────
def test_dashboard_returns_counts(client):
    tc, _ = client
    login(tc)
    r = tc.get("/api/v1/admin/cms/dashboard")
    assert r.status_code == 200
    data = r.json()
    assert "published_events" in data
    assert "draft_events" in data
    assert "active_announcements" in data
    assert "total_sermons" in data
    assert "gallery_albums" in data
    assert "service_times" in data


# ── Events CRUD ───────────────────────────────────────────────────────────────
def test_create_event(client):
    tc, _ = client
    login(tc)
    r = tc.post("/api/v1/admin/cms/events", json={
        "title": "Parish Feast Day",
        "description": "Annual feast celebration",
        "start_datetime": "2026-12-13T09:00:00Z",
        "location": "Church Hall",
        "category": "Feast",
    })
    assert r.status_code == 201
    data = r.json()
    assert data["title"] == "Parish Feast Day"
    assert data["status"] == "DRAFT"
    assert "slug" in data
    assert "id" in data


def test_event_validation_rejects_bad_url(client):
    tc, _ = client
    login(tc)
    r = tc.post("/api/v1/admin/cms/events", json={
        "title": "Bad URL Event",
        "start_datetime": "2026-12-01T10:00:00Z",
        "image_url": "javascript:alert(1)",
    })
    assert r.status_code == 422


def test_event_validation_requires_title(client):
    tc, _ = client
    login(tc)
    r = tc.post("/api/v1/admin/cms/events", json={"start_datetime": "2026-12-01T10:00:00Z"})
    assert r.status_code == 422


def test_get_event(client):
    tc, _ = client
    login(tc)
    created = tc.post("/api/v1/admin/cms/events", json={
        "title": "Get Test", "start_datetime": "2026-12-01T10:00:00Z"
    }).json()
    r = tc.get(f"/api/v1/admin/cms/events/{created['id']}")
    assert r.status_code == 200
    assert r.json()["id"] == created["id"]


def test_update_event(client):
    tc, _ = client
    login(tc)
    created = tc.post("/api/v1/admin/cms/events", json={
        "title": "Original Title", "start_datetime": "2026-12-01T10:00:00Z"
    }).json()
    r = tc.patch(f"/api/v1/admin/cms/events/{created['id']}", json={"title": "Updated Title"})
    assert r.status_code == 200
    assert r.json()["title"] == "Updated Title"


def test_event_not_found(client):
    tc, _ = client
    login(tc)
    import uuid
    assert tc.get(f"/api/v1/admin/cms/events/{uuid.uuid4()}").status_code == 404


# ── Event publishing workflow ─────────────────────────────────────────────────
def test_event_publish_unpublish(client):
    tc, _ = client
    login(tc)
    ev = tc.post("/api/v1/admin/cms/events", json={
        "title": "Publish Test", "start_datetime": "2026-12-01T10:00:00Z"
    }).json()
    eid = ev["id"]

    # draft is not public
    pub = tc.get("/api/v1/public/events")
    assert not any(e["id"] == eid for e in pub.json()["items"])

    # publish
    r = tc.post(f"/api/v1/admin/cms/events/{eid}/publish")
    assert r.status_code == 200
    assert r.json()["status"] == "PUBLISHED"

    # now public
    pub = tc.get("/api/v1/public/events")
    assert any(e["id"] == eid for e in pub.json()["items"])

    # unpublish
    r = tc.post(f"/api/v1/admin/cms/events/{eid}/unpublish")
    assert r.status_code == 200
    assert r.json()["status"] == "DRAFT"

    # no longer public
    pub = tc.get("/api/v1/public/events")
    assert not any(e["id"] == eid for e in pub.json()["items"])


def test_archived_event_not_public(client):
    tc, _ = client
    login(tc)
    ev = tc.post("/api/v1/admin/cms/events", json={
        "title": "Archive Test", "start_datetime": "2026-12-01T10:00:00Z"
    }).json()
    tc.post(f"/api/v1/admin/cms/events/{ev['id']}/publish")
    tc.post(f"/api/v1/admin/cms/events/{ev['id']}/archive")
    pub = tc.get("/api/v1/public/events")
    assert not any(e["id"] == ev["id"] for e in pub.json()["items"])


def test_event_list_search_and_filter(client):
    tc, _ = client
    login(tc)
    tc.post("/api/v1/admin/cms/events", json={"title": "Searchable Event XYZ", "start_datetime": "2026-12-01T10:00:00Z"})
    r = tc.get("/api/v1/admin/cms/events", params={"search": "XYZ"})
    assert r.status_code == 200
    assert r.json()["total"] >= 1

    r2 = tc.get("/api/v1/admin/cms/events", params={"status": "DRAFT"})
    assert r2.status_code == 200
    assert all(e["status"] == "DRAFT" for e in r2.json()["items"])


# ── Announcements CRUD ────────────────────────────────────────────────────────
def test_create_announcement(client):
    tc, _ = client
    login(tc)
    r = tc.post("/api/v1/admin/cms/announcements", json={
        "title": "Important Notice",
        "description": "Please note the following.",
        "type": "IMPORTANT",
    })
    assert r.status_code == 201
    data = r.json()
    assert data["title"] == "Important Notice"
    assert data["status"] == "DRAFT"


def test_announcement_publish_sets_published_at(client):
    tc, _ = client
    login(tc)
    ann = tc.post("/api/v1/admin/cms/announcements", json={
        "title": "Pub Date Test", "description": "Test"
    }).json()
    r = tc.post(f"/api/v1/admin/cms/announcements/{ann['id']}/publish")
    assert r.status_code == 200
    assert r.json()["published_at"] is not None
    assert r.json()["status"] == "PUBLISHED"


def test_draft_announcement_not_public(client):
    tc, _ = client
    login(tc)
    ann = tc.post("/api/v1/admin/cms/announcements", json={
        "title": "Draft Ann", "description": "Not public"
    }).json()
    pub = tc.get("/api/v1/public/announcements")
    assert not any(a["id"] == ann["id"] for a in pub.json()["items"])


def test_published_announcement_is_public(client):
    tc, _ = client
    login(tc)
    ann = tc.post("/api/v1/admin/cms/announcements", json={
        "title": "Public Ann", "description": "Visible"
    }).json()
    tc.post(f"/api/v1/admin/cms/announcements/{ann['id']}/publish")
    pub = tc.get("/api/v1/public/announcements")
    assert any(a["id"] == ann["id"] for a in pub.json()["items"])


def test_archived_announcement_not_public(client):
    tc, _ = client
    login(tc)
    ann = tc.post("/api/v1/admin/cms/announcements", json={
        "title": "Archive Ann", "description": "Will be archived"
    }).json()
    tc.post(f"/api/v1/admin/cms/announcements/{ann['id']}/publish")
    tc.post(f"/api/v1/admin/cms/announcements/{ann['id']}/archive")
    pub = tc.get("/api/v1/public/announcements")
    assert not any(a["id"] == ann["id"] for a in pub.json()["items"])


def test_announcement_validation(client):
    tc, _ = client
    login(tc)
    assert tc.post("/api/v1/admin/cms/announcements", json={}).status_code == 422
    assert tc.post("/api/v1/admin/cms/announcements", json={
        "title": "Bad", "image_url": "not-a-url"
    }).status_code == 422


# ── Sermons CRUD ──────────────────────────────────────────────────────────────
def test_create_sermon(client):
    tc, _ = client
    login(tc)
    r = tc.post("/api/v1/admin/cms/sermons", json={
        "title": "A Reflection on Hope",
        "speaker_name": "Fr. Thomas",
        "date": "2026-08-16",
        "description": "A message of hope.",
    })
    assert r.status_code == 201
    data = r.json()
    assert data["title"] == "A Reflection on Hope"
    assert data["status"] == "DRAFT"
    assert data["series"] is None


def test_sermon_with_series(client):
    tc, _ = client
    login(tc)
    series = tc.post("/api/v1/admin/cms/sermon-series", json={"title": "Advent Series"}).json()
    r = tc.post("/api/v1/admin/cms/sermons", json={
        "title": "Advent Week 1",
        "date": "2026-12-01",
        "series_id": series["id"],
    })
    assert r.status_code == 201
    assert r.json()["series"]["title"] == "Advent Series"


def test_sermon_publish_unpublish(client):
    tc, _ = client
    login(tc)
    s = tc.post("/api/v1/admin/cms/sermons", json={
        "title": "Pub Sermon", "date": "2026-08-01"
    }).json()
    sid = s["id"]

    # draft not public
    pub = tc.get("/api/v1/public/sermons")
    assert not any(x["id"] == sid for x in pub.json()["items"])

    tc.post(f"/api/v1/admin/cms/sermons/{sid}/publish")
    pub = tc.get("/api/v1/public/sermons")
    assert any(x["id"] == sid for x in pub.json()["items"])

    tc.post(f"/api/v1/admin/cms/sermons/{sid}/unpublish")
    pub = tc.get("/api/v1/public/sermons")
    assert not any(x["id"] == sid for x in pub.json()["items"])


def test_sermon_url_validation(client):
    tc, _ = client
    login(tc)
    r = tc.post("/api/v1/admin/cms/sermons", json={
        "title": "Bad URL", "date": "2026-08-01",
        "video_url": "javascript:void(0)",
    })
    assert r.status_code == 422


# ── Gallery CRUD ──────────────────────────────────────────────────────────────
def test_create_album(client):
    tc, _ = client
    login(tc)
    r = tc.post("/api/v1/admin/cms/gallery", json={
        "title": "Parish Moments",
        "description": "Photos from parish life.",
    })
    assert r.status_code == 201
    data = r.json()
    assert data["title"] == "Parish Moments"
    assert data["status"] == "DRAFT"
    assert data["images"] == []


def test_delete_album(client):
    tc, _ = client
    login(tc)
    album = tc.post("/api/v1/admin/cms/gallery", json={"title": "To Delete"}).json()
    aid = album["id"]
    tc.post(f"/api/v1/admin/cms/gallery/{aid}/images", json={
        "image_url": "https://example.com/delete_test.jpg",
        "alt_text": "Sample",
        "sort_order": 0,
    })
    r = tc.delete(f"/api/v1/admin/cms/gallery/{aid}")
    assert r.status_code == 204
    get_r = tc.get(f"/api/v1/admin/cms/gallery/{aid}")
    assert get_r.status_code == 404


def test_add_and_remove_image(client):
    tc, _ = client
    login(tc)
    album = tc.post("/api/v1/admin/cms/gallery", json={"title": "Image Test"}).json()
    aid = album["id"]

    img = tc.post(f"/api/v1/admin/cms/gallery/{aid}/images", json={
        "image_url": "https://example.com/photo.jpg",
        "alt_text": "A church photo",
        "sort_order": 0,
    })
    assert img.status_code == 201
    iid = img.json()["id"]

    album_detail = tc.get(f"/api/v1/admin/cms/gallery/{aid}").json()
    assert any(i["id"] == iid for i in album_detail["images"])

    del_r = tc.delete(f"/api/v1/admin/cms/gallery/{aid}/images/{iid}")
    assert del_r.status_code == 204

    album_detail = tc.get(f"/api/v1/admin/cms/gallery/{aid}").json()
    assert not any(i["id"] == iid for i in album_detail["images"])


def test_unpublished_album_not_public(client):
    tc, _ = client
    login(tc)
    album = tc.post("/api/v1/admin/cms/gallery", json={"title": "Private Album"}).json()
    pub = tc.get("/api/v1/public/gallery")
    assert not any(a["id"] == album["id"] for a in pub.json()["items"])


def test_published_album_is_public(client):
    tc, _ = client
    login(tc)
    album = tc.post("/api/v1/admin/cms/gallery", json={"title": "Public Album"}).json()
    tc.post(f"/api/v1/admin/cms/gallery/{album['id']}/publish")
    pub = tc.get("/api/v1/public/gallery")
    assert any(a["id"] == album["id"] for a in pub.json()["items"])


def test_archived_album_not_public(client):
    tc, _ = client
    login(tc)
    album = tc.post("/api/v1/admin/cms/gallery", json={"title": "Archive Album"}).json()
    tc.post(f"/api/v1/admin/cms/gallery/{album['id']}/publish")
    tc.post(f"/api/v1/admin/cms/gallery/{album['id']}/archive")
    pub = tc.get("/api/v1/public/gallery")
    assert not any(a["id"] == album["id"] for a in pub.json()["items"])


def test_image_url_validation(client):
    tc, _ = client
    login(tc)
    album = tc.post("/api/v1/admin/cms/gallery", json={"title": "Validation Album"}).json()
    r = tc.post(f"/api/v1/admin/cms/gallery/{album['id']}/images", json={
        "image_url": "data:image/png;base64,abc",
        "alt_text": "Bad",
    })
    assert r.status_code == 422


# ── Service Times ─────────────────────────────────────────────────────────────
def test_create_service_time(client):
    tc, _ = client
    login(tc)
    r = tc.post("/api/v1/admin/cms/service-times", json={
        "day_of_week": 0,
        "start_time": "08:00:00",
        "service_name": "Holy Qurbana",
        "location": "Main Church",
        "sort_order": 1,
        "is_active": True,
    })
    assert r.status_code == 201
    data = r.json()
    assert data["service_name"] == "Holy Qurbana"
    assert data["is_active"] is True


def test_update_service_time(client):
    tc, _ = client
    login(tc)
    st = tc.post("/api/v1/admin/cms/service-times", json={
        "day_of_week": 0, "start_time": "09:00:00", "service_name": "Old Name"
    }).json()
    r = tc.patch(f"/api/v1/admin/cms/service-times/{st['id']}", json={"service_name": "New Name"})
    assert r.status_code == 200
    assert r.json()["service_name"] == "New Name"


def test_delete_service_time(client):
    tc, _ = client
    login(tc)
    st = tc.post("/api/v1/admin/cms/service-times", json={
        "day_of_week": 6, "start_time": "10:00:00", "service_name": "Delete Me"
    }).json()
    r = tc.delete(f"/api/v1/admin/cms/service-times/{st['id']}")
    assert r.status_code == 204


def test_active_service_times_are_public(client):
    tc, _ = client
    login(tc)
    tc.post("/api/v1/admin/cms/service-times", json={
        "day_of_week": 0, "start_time": "08:30:00",
        "service_name": "Public Service", "is_active": True,
    })
    pub = tc.get("/api/v1/public/service-times")
    assert pub.status_code == 200
    assert any(s["service_name"] == "Public Service" for s in pub.json())


def test_inactive_service_time_not_public(client):
    tc, _ = client
    login(tc)
    tc.post("/api/v1/admin/cms/service-times", json={
        "day_of_week": 1, "start_time": "07:00:00",
        "service_name": "Inactive Service", "is_active": False,
    })
    pub = tc.get("/api/v1/public/service-times")
    assert not any(s["service_name"] == "Inactive Service" for s in pub.json())


def test_service_time_day_validation(client):
    tc, _ = client
    login(tc)
    r = tc.post("/api/v1/admin/cms/service-times", json={
        "day_of_week": 9, "start_time": "08:00:00", "service_name": "Bad Day"
    })
    assert r.status_code == 422


# ── Page Content ──────────────────────────────────────────────────────────────
def test_upsert_page_content(client):
    tc, _ = client
    login(tc)
    r = tc.put("/api/v1/admin/cms/content/homepage/hero", json={
        "heading": "Welcome to our parish",
        "body": "A place of faith and community.",
        "status": "PUBLISHED",
    })
    assert r.status_code == 200
    data = r.json()
    assert data["heading"] == "Welcome to our parish"
    assert data["page"] == "homepage"
    assert data["section"] == "hero"

    # idempotent upsert
    r2 = tc.put("/api/v1/admin/cms/content/homepage/hero", json={"heading": "Updated Heading"})
    assert r2.status_code == 200
    assert r2.json()["heading"] == "Updated Heading"


def test_page_content_image_url_validation(client):
    tc, _ = client
    login(tc)
    r = tc.put("/api/v1/admin/cms/content/homepage/hero", json={
        "image_url": "ftp://bad-protocol.com/img.jpg"
    })
    assert r.status_code == 422


def test_published_page_content_is_public(client):
    tc, _ = client
    login(tc)
    tc.put("/api/v1/admin/cms/content/homepage/intro", json={
        "heading": "Public Heading",
        "body": "Public body text.",
        "status": "PUBLISHED",
    })
    pub = tc.get("/api/v1/public/content", params={"page": "homepage"})
    assert pub.status_code == 200
    sections = {c["section"]: c for c in pub.json()}
    assert "intro" in sections
    assert sections["intro"]["heading"] == "Public Heading"


def test_draft_page_content_not_public(client):
    tc, _ = client
    login(tc)
    tc.put("/api/v1/admin/cms/content/homepage/draft_section", json={
        "heading": "Draft Heading",
        "status": "DRAFT",
    })
    pub = tc.get("/api/v1/public/content", params={"page": "homepage"})
    sections = {c["section"]: c for c in pub.json()}
    assert "draft_section" not in sections


# ── Site Settings ─────────────────────────────────────────────────────────────
def test_upsert_setting(client):
    tc, _ = client
    login(tc)
    r = tc.put("/api/v1/admin/cms/settings/church_name", json={"value": "St. Anthony's Church"})
    assert r.status_code == 200
    assert r.json()["key"] == "church_name"
    assert r.json()["value"] == "St. Anthony's Church"


def test_setting_idempotent_update(client):
    tc, _ = client
    login(tc)
    tc.put("/api/v1/admin/cms/settings/tagline", json={"value": "First value"})
    r = tc.put("/api/v1/admin/cms/settings/tagline", json={"value": "Updated value"})
    assert r.status_code == 200
    assert r.json()["value"] == "Updated value"


def test_unknown_setting_rejected(client):
    tc, _ = client
    login(tc)
    r = tc.put("/api/v1/admin/cms/settings/secret_key", json={"value": "hacked"})
    assert r.status_code == 400


def test_public_settings_visible(client):
    tc, _ = client
    login(tc)
    tc.put("/api/v1/admin/cms/settings/church_name", json={"value": "St. Anthony's"})
    pub = tc.get("/api/v1/public/settings")
    assert pub.status_code == 200
    keys = {s["key"] for s in pub.json()}
    assert "church_name" in keys


# ── Public projection — no private fields ─────────────────────────────────────
def test_public_event_no_admin_fields(client):
    tc, _ = client
    login(tc)
    ev = tc.post("/api/v1/admin/cms/events", json={
        "title": "Field Test", "start_datetime": "2026-12-01T10:00:00Z"
    }).json()
    tc.post(f"/api/v1/admin/cms/events/{ev['id']}/publish")
    pub = tc.get("/api/v1/public/events")
    item = next(e for e in pub.json()["items"] if e["id"] == ev["id"])
    assert "status" not in item
    assert "created_at" not in item
    assert "updated_at" not in item


def test_public_sermon_no_admin_fields(client):
    tc, _ = client
    login(tc)
    s = tc.post("/api/v1/admin/cms/sermons", json={
        "title": "Field Sermon", "date": "2026-08-01"
    }).json()
    tc.post(f"/api/v1/admin/cms/sermons/{s['id']}/publish")
    pub = tc.get("/api/v1/public/sermons")
    item = next(x for x in pub.json()["items"] if x["id"] == s["id"])
    assert "status" not in item
    assert "updated_at" not in item


# ── Audit logging ─────────────────────────────────────────────────────────────
def test_audit_log_written_on_publish(client):
    tc, sl = client
    login(tc)
    ev = tc.post("/api/v1/admin/cms/events", json={
        "title": "Audit Event", "start_datetime": "2026-12-01T10:00:00Z"
    }).json()
    tc.post(f"/api/v1/admin/cms/events/{ev['id']}/publish")
    from app.models.domain import AuditLog
    from sqlalchemy import select
    with sl() as db:
        logs = db.scalars(select(AuditLog).where(
            AuditLog.entity_id == ev["id"],
            AuditLog.action == "content.event.published",
        )).all()
    assert len(logs) >= 1
    assert "password" not in str(logs[0].metadata_json)
