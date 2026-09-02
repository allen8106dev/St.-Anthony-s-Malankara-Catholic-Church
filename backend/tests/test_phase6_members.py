"""Phase 6 — member and family management tests."""
from __future__ import annotations
import pytest
from app.models.domain import Family, Member, MembershipStatus, RoleName

PASSWORD = "CorrectHorseBattery1"


def login(client, email: str = "super@example.test", password: str = PASSWORD):
    return client.post("/api/v1/auth/login", json={"email": email, "password": password})


def _seed_family_and_member(session_local):
    with session_local() as db:
        family = Family(family_name="Thomas Family", address="123 Church St")
        db.add(family)
        db.flush()
        member = Member(
            first_name="George", last_name="Thomas", phone="555-1234",
            email="george@example.test", membership_status=MembershipStatus.ACTIVE,
            family_id=family.id,
        )
        db.add(member)
        db.commit()
        return str(family.id), str(member.id)


# ── authentication boundary ───────────────────────────────────────────────────
def test_members_requires_authentication(client):
    tc, _ = client
    assert tc.get("/api/v1/admin/members").status_code == 401
    assert tc.post("/api/v1/admin/members", json={}).status_code == 401
    assert tc.get("/api/v1/admin/families").status_code == 401
    assert tc.post("/api/v1/admin/families", json={}).status_code == 401


# ── authorization matrix ──────────────────────────────────────────────────────
@pytest.mark.parametrize("role,can_view,can_write", [
    (RoleName.SUPER_ADMIN, True, True),
    (RoleName.MEMBER_ADMIN, True, True),
    (RoleName.CONTENT_ADMIN, False, False),
    (RoleName.TREASURER, False, False),
])
def test_member_endpoint_authorization(client, role, can_view, can_write):
    tc, _ = client
    email = f"{role.value.lower().replace('_admin', '')}@example.test"
    assert login(tc, email).status_code == 200

    get_status = tc.get("/api/v1/admin/members").status_code
    assert get_status == (200 if can_view else 403)

    post_status = tc.post("/api/v1/admin/members", json={"first_name": "X", "last_name": "Y"}).status_code
    assert post_status in ((201 if can_write else 403),)


@pytest.mark.parametrize("role,can_view,can_write", [
    (RoleName.SUPER_ADMIN, True, True),
    (RoleName.MEMBER_ADMIN, True, True),
    (RoleName.CONTENT_ADMIN, False, False),
    (RoleName.TREASURER, False, False),
])
def test_family_endpoint_authorization(client, role, can_view, can_write):
    tc, _ = client
    email = f"{role.value.lower().replace('_admin', '')}@example.test"
    assert login(tc, email).status_code == 200

    get_status = tc.get("/api/v1/admin/families").status_code
    assert get_status == (200 if can_view else 403)

    post_status = tc.post("/api/v1/admin/families", json={"family_name": "Test"}).status_code
    assert post_status in ((201 if can_write else 403),)


# ── member CRUD ───────────────────────────────────────────────────────────────
def test_create_and_retrieve_member(client):
    tc, _ = client
    login(tc)
    resp = tc.post("/api/v1/admin/members", json={
        "first_name": "Mary", "last_name": "Joseph",
        "email": "mary@example.test", "membership_status": "ACTIVE",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["first_name"] == "Mary"
    assert data["last_name"] == "Joseph"
    assert "password" not in str(data)

    detail = tc.get(f"/api/v1/admin/members/{data['id']}")
    assert detail.status_code == 200
    assert detail.json()["email"] == "mary@example.test"


def test_update_member(client):
    tc, sl = client
    login(tc)
    resp = tc.post("/api/v1/admin/members", json={"first_name": "John", "last_name": "Doe"})
    mid = resp.json()["id"]
    patch = tc.patch(f"/api/v1/admin/members/{mid}", json={"membership_status": "INACTIVE", "phone": "555-9999"})
    assert patch.status_code == 200
    assert patch.json()["membership_status"] == "INACTIVE"
    assert patch.json()["phone"] == "555-9999"


def test_member_not_found(client):
    tc, _ = client
    login(tc)
    import uuid
    assert tc.get(f"/api/v1/admin/members/{uuid.uuid4()}").status_code == 404


def test_create_member_invalid_family(client):
    tc, _ = client
    login(tc)
    import uuid
    resp = tc.post("/api/v1/admin/members", json={
        "first_name": "X", "last_name": "Y", "family_id": str(uuid.uuid4()),
    })
    assert resp.status_code == 422


def test_create_member_validation_errors(client):
    tc, _ = client
    login(tc)
    # missing required fields
    assert tc.post("/api/v1/admin/members", json={"first_name": "Only"}).status_code == 422
    # invalid status
    assert tc.post("/api/v1/admin/members", json={"first_name": "A", "last_name": "B", "membership_status": "ZOMBIE"}).status_code == 422


# ── family CRUD ───────────────────────────────────────────────────────────────
def test_create_and_retrieve_family(client):
    tc, _ = client
    login(tc)
    resp = tc.post("/api/v1/admin/families", json={"family_name": "Kurian Family", "address": "456 Parish Rd"})
    assert resp.status_code == 201
    fid = resp.json()["id"]

    detail = tc.get(f"/api/v1/admin/families/{fid}")
    assert detail.status_code == 200
    assert detail.json()["family_name"] == "Kurian Family"
    assert "members" in detail.json()


def test_update_family(client):
    tc, _ = client
    login(tc)
    resp = tc.post("/api/v1/admin/families", json={"family_name": "Old Name"})
    fid = resp.json()["id"]
    patch = tc.patch(f"/api/v1/admin/families/{fid}", json={"family_name": "New Name"})
    assert patch.status_code == 200
    assert patch.json()["family_name"] == "New Name"


def test_family_not_found(client):
    tc, _ = client
    login(tc)
    import uuid
    assert tc.get(f"/api/v1/admin/families/{uuid.uuid4()}").status_code == 404


# ── family/member relationship ────────────────────────────────────────────────
def test_member_assigned_to_family(client):
    tc, sl = client
    login(tc)
    fid, mid = _seed_family_and_member(sl)
    detail = tc.get(f"/api/v1/admin/families/{fid}")
    assert detail.status_code == 200
    member_ids = [m["id"] for m in detail.json()["members"]]
    assert mid in member_ids


def test_member_family_name_in_list(client):
    tc, sl = client
    login(tc)
    _seed_family_and_member(sl)
    resp = tc.get("/api/v1/admin/members", params={"search": "George"})
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert any(i["family_name"] == "Thomas Family" for i in items)


# ── search and filtering ──────────────────────────────────────────────────────
def test_member_search(client):
    tc, sl = client
    login(tc)
    _seed_family_and_member(sl)
    resp = tc.get("/api/v1/admin/members", params={"search": "George"})
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1
    assert all("George" in i["first_name"] or "Thomas" in i["last_name"] for i in resp.json()["items"])


def test_member_status_filter(client):
    tc, sl = client
    login(tc)
    _seed_family_and_member(sl)
    resp = tc.get("/api/v1/admin/members", params={"status": "ACTIVE"})
    assert resp.status_code == 200
    assert all(i["membership_status"] == "ACTIVE" for i in resp.json()["items"])

    resp2 = tc.get("/api/v1/admin/members", params={"status": "DECEASED"})
    assert resp2.status_code == 200
    assert resp2.json()["total"] == 0


def test_member_family_filter(client):
    tc, sl = client
    login(tc)
    fid, mid = _seed_family_and_member(sl)
    resp = tc.get("/api/v1/admin/members", params={"family_id": fid})
    assert resp.status_code == 200
    assert all(i["family_id"] == fid for i in resp.json()["items"])


def test_family_search(client):
    tc, sl = client
    login(tc)
    _seed_family_and_member(sl)
    resp = tc.get("/api/v1/admin/families", params={"search": "Thomas"})
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1


# ── pagination ────────────────────────────────────────────────────────────────
def test_member_pagination(client):
    tc, sl = client
    login(tc)
    # create 5 members
    with sl() as db:
        for i in range(5):
            db.add(Member(first_name=f"Pag{i}", last_name="Test", membership_status=MembershipStatus.ACTIVE))
        db.commit()
    resp = tc.get("/api/v1/admin/members", params={"page": 1, "page_size": 2, "search": "Pag"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["page"] == 1
    assert data["page_size"] == 2
    assert len(data["items"]) == 2
    assert data["total"] >= 5
    assert data["pages"] >= 3


def test_family_pagination(client):
    tc, sl = client
    login(tc)
    with sl() as db:
        for i in range(4):
            db.add(Family(family_name=f"PagFamily{i}"))
        db.commit()
    resp = tc.get("/api/v1/admin/families", params={"page": 1, "page_size": 2, "search": "PagFamily"})
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["items"]) == 2
    assert data["total"] >= 4


# ── data isolation ────────────────────────────────────────────────────────────
def test_member_detail_does_not_expose_unrelated_data(client):
    tc, sl = client
    login(tc)
    resp = tc.post("/api/v1/admin/members", json={"first_name": "Private", "last_name": "Person"})
    assert resp.status_code == 201
    body = resp.json()
    assert "password" not in body
    assert "token" not in body
    assert "session" not in body
    assert "password_hash" not in str(body)


# ── member relationships ──────────────────────────────────────────────────────
def test_add_and_list_relationship(client):
    tc, _ = client
    login(tc)
    r1 = tc.post("/api/v1/admin/members", json={"first_name": "A", "last_name": "Rel"})
    r2 = tc.post("/api/v1/admin/members", json={"first_name": "B", "last_name": "Rel"})
    mid1, mid2 = r1.json()["id"], r2.json()["id"]
    rel = tc.post(f"/api/v1/admin/members/{mid1}/relationships", json={"member_b_id": mid2, "relationship_type": "SPOUSE"})
    assert rel.status_code == 201
    listed = tc.get(f"/api/v1/admin/members/{mid1}/relationships")
    assert listed.status_code == 200
    assert len(listed.json()) == 1


def test_self_relationship_rejected(client):
    tc, _ = client
    login(tc)
    r = tc.post("/api/v1/admin/members", json={"first_name": "Solo", "last_name": "Self"})
    mid = r.json()["id"]
    resp = tc.post(f"/api/v1/admin/members/{mid}/relationships", json={"member_b_id": mid, "relationship_type": "SIBLING"})
    assert resp.status_code == 422
