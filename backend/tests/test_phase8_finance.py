"""Phase 8 — Dues & Financial Management tests."""
from __future__ import annotations
from datetime import date, datetime, timezone
from decimal import Decimal
import uuid
import pytest
from sqlalchemy import select
from app.models.domain import AdminUser, AuditLog, Due, DueStatus, Family, Member, MembershipStatus, Payment, PaymentMethod, PaymentStatus, RoleName

PASSWORD = "CorrectHorseBattery1"


def login(client, email: str = "super@example.test", password: str = PASSWORD):
    return client.post("/api/v1/auth/login", json={"email": email, "password": password})


def _seed_test_data(session_local):
    with session_local() as db:
        family = Family(family_name="Joseph Family", address="123 Faith Rd")
        db.add(family)
        db.flush()

        member = Member(
            first_name="Mathew",
            last_name="Joseph",
            phone="555-0101",
            email="mathew@example.test",
            membership_status=MembershipStatus.ACTIVE,
            family_id=family.id,
        )
        other_member = Member(
            first_name="Thomas",
            last_name="Kurian",
            phone="555-0102",
            email="thomas@example.test",
            membership_status=MembershipStatus.ACTIVE,
        )
        db.add_all([member, other_member])
        db.commit()
        return str(family.id), str(member.id), str(other_member.id)


# ── Authentication boundary ───────────────────────────────────────────────────
def test_finance_endpoints_require_authentication(client):
    tc, _ = client
    assert tc.get("/api/v1/admin/finance/summary").status_code == 401
    assert tc.get("/api/v1/admin/dues").status_code == 401
    assert tc.post("/api/v1/admin/dues", json={}).status_code == 401
    assert tc.get("/api/v1/admin/payments").status_code == 401
    assert tc.post("/api/v1/admin/payments", json={}).status_code == 401


# ── Authorization matrix ──────────────────────────────────────────────────────
@pytest.mark.parametrize("role,can_view_dues,can_manage_dues,can_view_payments,can_manage_payments", [
    (RoleName.SUPER_ADMIN, True, True, True, True),
    (RoleName.TREASURER, True, True, True, True),
    (RoleName.MEMBER_ADMIN, True, True, False, False),
    (RoleName.CONTENT_ADMIN, False, False, False, False),
])
def test_finance_role_permissions(client, role, can_view_dues, can_manage_dues, can_view_payments, can_manage_payments):
    tc, sl = client
    fid, mid, _ = _seed_test_data(sl)
    email = f"{role.value.lower().replace('_admin', '')}@example.test"
    assert login(tc, email).status_code == 200

    # Summary requires DUES_VIEW
    sum_resp = tc.get("/api/v1/admin/finance/summary")
    assert sum_resp.status_code == (200 if can_view_dues else 403)

    # Dues list
    dues_resp = tc.get("/api/v1/admin/dues")
    assert dues_resp.status_code == (200 if can_view_dues else 403)

    # Create due
    create_due_resp = tc.post("/api/v1/admin/dues", json={
        "member_id": mid,
        "title": "Annual Subscription",
        "amount": "1000.00",
        "due_type": "ANNUAL",
    })
    assert create_due_resp.status_code == (201 if can_manage_dues else 403)

    # Payments list
    payments_resp = tc.get("/api/v1/admin/payments")
    assert payments_resp.status_code == (200 if can_view_payments else 403)


# ── Dues CRUD & Business Logic ────────────────────────────────────────────────
def test_create_and_retrieve_due_for_member(client):
    tc, sl = client
    _, mid, _ = _seed_test_data(sl)
    login(tc)

    resp = tc.post("/api/v1/admin/dues", json={
        "member_id": mid,
        "title": "2026 Parish Feast Contribution",
        "due_type": "FEAST_CONTRIBUTION",
        "amount": "2500.00",
        "due_date": "2026-10-15",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "2026 Parish Feast Contribution"
    assert Decimal(data["amount"]) == Decimal("2500.00")
    assert Decimal(data["amount_paid"]) == Decimal("0.00")
    assert Decimal(data["outstanding"]) == Decimal("2500.00")
    assert data["status"] == "PENDING"
    assert data["member_id"] == mid
    assert "Mathew Joseph" in data["member_name"]

    detail = tc.get(f"/api/v1/admin/dues/{data['id']}")
    assert detail.status_code == 200
    assert detail.json()["title"] == "2026 Parish Feast Contribution"


def test_create_due_for_family(client):
    tc, sl = client
    fid, _, _ = _seed_test_data(sl)
    login(tc)

    resp = tc.post("/api/v1/admin/dues", json={
        "family_id": fid,
        "title": "Annual Family Dues 2026",
        "due_type": "ANNUAL_MEMBERSHIP",
        "amount": "5000.00",
        "period_start": "2026-01-01",
        "period_end": "2026-12-31",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["family_id"] == fid
    assert data["family_name"] == "Joseph Family"
    assert Decimal(data["outstanding"]) == Decimal("5000.00")


def test_create_due_validation(client):
    tc, sl = client
    login(tc)

    # Missing both member and family
    resp1 = tc.post("/api/v1/admin/dues", json={"title": "No Owner", "amount": "500.00"})
    assert resp1.status_code == 422

    # Negative amount
    _, mid, _ = _seed_test_data(sl)
    resp2 = tc.post("/api/v1/admin/dues", json={"member_id": mid, "title": "Negative", "amount": "-100.00"})
    assert resp2.status_code == 422

    # Non-existent member
    resp3 = tc.post("/api/v1/admin/dues", json={"member_id": str(uuid.uuid4()), "title": "Ghost", "amount": "100.00"})
    assert resp3.status_code == 422


def test_update_due(client):
    tc, sl = client
    _, mid, _ = _seed_test_data(sl)
    login(tc)

    created = tc.post("/api/v1/admin/dues", json={
        "member_id": mid,
        "title": "Original Title",
        "amount": "1000.00",
    }).json()

    updated = tc.patch(f"/api/v1/admin/dues/{created['id']}", json={
        "title": "Updated Title",
        "amount": "1500.00",
    })
    assert updated.status_code == 200
    assert updated.json()["title"] == "Updated Title"
    assert Decimal(updated.json()["amount"]) == Decimal("1500.00")


def test_cancel_due(client):
    tc, sl = client
    _, mid, _ = _seed_test_data(sl)
    login(tc)

    created = tc.post("/api/v1/admin/dues", json={"member_id": mid, "title": "To Cancel", "amount": "1000.00"}).json()
    cancelled = tc.post(f"/api/v1/admin/dues/{created['id']}/cancel")
    assert cancelled.status_code == 200
    assert cancelled.json()["status"] == "CANCELLED"

    # Cannot pay cancelled due
    pay_resp = tc.post(f"/api/v1/admin/dues/{created['id']}/payments", json={
        "amount": "500.00",
        "payment_date": "2026-09-01T12:00:00Z",
        "payment_method": "CASH",
    })
    assert pay_resp.status_code == 422


# ── Payments Recording & Status Transitions ────────────────────────────────────
def test_partial_and_full_payment_lifecycle(client):
    tc, sl = client
    _, mid, _ = _seed_test_data(sl)
    login(tc)

    # 1. Create a due for 2000
    due = tc.post("/api/v1/admin/dues", json={
        "member_id": mid,
        "title": "Building Fund",
        "amount": "2000.00",
    }).json()
    due_id = due["id"]

    # 2. Record 1st payment of 500
    p1 = tc.post(f"/api/v1/admin/dues/{due_id}/payments", json={
        "amount": "500.00",
        "payment_date": "2026-09-01T10:00:00Z",
        "payment_method": "CASH",
        "reference": "REC-001",
    })
    assert p1.status_code == 201
    assert p1.json()["status"] == "COMPLETED"
    assert p1.json()["recorded_by_name"] == "Super"

    # Check due status -> PARTIALLY_PAID
    due_check = tc.get(f"/api/v1/admin/dues/{due_id}").json()
    assert due_check["status"] == "PARTIALLY_PAID"
    assert Decimal(due_check["amount_paid"]) == Decimal("500.00")
    assert Decimal(due_check["outstanding"]) == Decimal("1500.00")
    assert len(due_check["payments"]) == 1

    # 3. Record 2nd payment of 1500 (full remaining)
    p2 = tc.post(f"/api/v1/admin/dues/{due_id}/payments", json={
        "amount": "1500.00",
        "payment_date": "2026-09-01T11:00:00Z",
        "payment_method": "UPI",
        "reference": "UPI/123456789",
    })
    assert p2.status_code == 201

    # Check due status -> PAID
    due_check2 = tc.get(f"/api/v1/admin/dues/{due_id}").json()
    assert due_check2["status"] == "PAID"
    assert Decimal(due_check2["amount_paid"]) == Decimal("2000.00")
    assert Decimal(due_check2["outstanding"]) == Decimal("0.00")
    assert len(due_check2["payments"]) == 2

    # 4. Attempting further payment on fully paid due is rejected
    p3 = tc.post(f"/api/v1/admin/dues/{due_id}/payments", json={
        "amount": "100.00",
        "payment_date": "2026-09-01T12:00:00Z",
        "payment_method": "CASH",
    })
    assert p3.status_code == 422


def test_overpayment_rejected(client):
    tc, sl = client
    _, mid, _ = _seed_test_data(sl)
    login(tc)

    due = tc.post("/api/v1/admin/dues", json={"member_id": mid, "title": "Sub", "amount": "1000.00"}).json()
    resp = tc.post(f"/api/v1/admin/dues/{due['id']}/payments", json={
        "amount": "1500.00",
        "payment_date": "2026-09-01T10:00:00Z",
        "payment_method": "BANK_TRANSFER",
    })
    assert resp.status_code == 422
    assert "exceeds" in resp.json()["detail"].lower()


def test_mismatched_member_rejected(client):
    tc, sl = client
    _, mid, other_mid = _seed_test_data(sl)
    login(tc)

    due = tc.post("/api/v1/admin/dues", json={"member_id": mid, "title": "Personal Due", "amount": "500.00"}).json()
    resp = tc.post(f"/api/v1/admin/dues/{due['id']}/payments", json={
        "member_id": other_mid,
        "amount": "500.00",
        "payment_date": "2026-09-01T10:00:00Z",
        "payment_method": "CASH",
    })
    assert resp.status_code == 422


def test_void_payment(client):
    tc, sl = client
    _, mid, _ = _seed_test_data(sl)
    login(tc)

    due = tc.post("/api/v1/admin/dues", json={"member_id": mid, "title": "Sub", "amount": "1000.00"}).json()
    payment = tc.post(f"/api/v1/admin/dues/{due['id']}/payments", json={
        "amount": "1000.00",
        "payment_date": "2026-09-01T10:00:00Z",
        "payment_method": "CHEQUE",
        "reference": "CHQ-987",
    }).json()

    assert tc.get(f"/api/v1/admin/dues/{due['id']}").json()["status"] == "PAID"

    # Void payment
    void_resp = tc.post(f"/api/v1/admin/payments/{payment['id']}/void")
    assert void_resp.status_code == 200
    assert void_resp.json()["status"] == "VOID"

    # Due status should revert to PENDING
    due_after_void = tc.get(f"/api/v1/admin/dues/{due['id']}").json()
    assert due_after_void["status"] == "PENDING"
    assert Decimal(due_after_void["amount_paid"]) == Decimal("0.00")
    assert Decimal(due_after_void["outstanding"]) == Decimal("1000.00")


# ── Filtering & Pagination ────────────────────────────────────────────────────
def test_dues_filtering_and_pagination(client):
    tc, sl = client
    fid, mid, other_mid = _seed_test_data(sl)
    login(tc)

    for i in range(5):
        tc.post("/api/v1/admin/dues", json={
            "member_id": mid if i % 2 == 0 else other_mid,
            "title": f"Dues Item {i}",
            "due_type": "MEMBERSHIP" if i < 3 else "SPECIAL",
            "amount": f"{100 * (i + 1)}.00",
        })

    # Search
    search_resp = tc.get("/api/v1/admin/dues", params={"search": "Item 2"})
    assert search_resp.status_code == 200
    assert search_resp.json()["total"] == 1

    # Filter by type
    type_resp = tc.get("/api/v1/admin/dues", params={"due_type": "MEMBERSHIP"})
    assert type_resp.status_code == 200
    assert type_resp.json()["total"] == 3

    # Filter by member
    member_resp = tc.get("/api/v1/admin/dues", params={"member_id": mid})
    assert member_resp.status_code == 200
    assert member_resp.json()["total"] == 3

    # Pagination
    page_resp = tc.get("/api/v1/admin/dues", params={"page": 1, "page_size": 2})
    assert page_resp.status_code == 200
    assert len(page_resp.json()["items"]) == 2
    assert page_resp.json()["pages"] == 3


# ── Audit Trail ───────────────────────────────────────────────────────────────
def test_financial_actions_create_audit_logs(client):
    tc, sl = client
    _, mid, _ = _seed_test_data(sl)
    login(tc)

    due = tc.post("/api/v1/admin/dues", json={"member_id": mid, "title": "Audit Test Due", "amount": "500.00"}).json()
    tc.patch(f"/api/v1/admin/dues/{due['id']}", json={"title": "Renamed Due"})
    payment = tc.post(f"/api/v1/admin/dues/{due['id']}/payments", json={
        "amount": "500.00",
        "payment_date": "2026-09-01T10:00:00Z",
        "payment_method": "CASH",
    }).json()
    tc.post(f"/api/v1/admin/payments/{payment['id']}/void")

    with sl() as db:
        logs = db.scalars(select(AuditLog).order_by(AuditLog.created_at.desc())).all()
        actions = [log.action for log in logs]
        assert "due.created" in actions
        assert "due.updated" in actions
        assert "payment.recorded" in actions
        assert "payment.voided" in actions

        # Verify no sensitive data in metadata
        for log in logs:
            meta_str = str(log.metadata_json)
            assert "password" not in meta_str
            assert "token" not in meta_str


# ── Finance Summary ───────────────────────────────────────────────────────────
def test_finance_overview_summary(client):
    tc, sl = client
    _, mid, _ = _seed_test_data(sl)
    login(tc)

    # 1 due of 1000, 500 paid
    d1 = tc.post("/api/v1/admin/dues", json={"member_id": mid, "title": "Due 1", "amount": "1000.00"}).json()
    tc.post(f"/api/v1/admin/dues/{d1['id']}/payments", json={
        "amount": "500.00",
        "payment_date": "2026-09-01T10:00:00Z",
        "payment_method": "CASH",
    })

    # 1 due of 2000, 0 paid
    tc.post("/api/v1/admin/dues", json={"member_id": mid, "title": "Due 2", "amount": "2000.00"})

    summary = tc.get("/api/v1/admin/finance/summary").json()
    assert Decimal(summary["total_collected"]) == Decimal("500.00")
    # outstanding = (1000 - 500) + 2000 = 2500
    assert Decimal(summary["total_outstanding"]) == Decimal("2500.00")
    assert summary["count_unpaid"] == 1
    assert summary["count_partially_paid"] == 1
    assert len(summary["recent_payments"]) == 1
