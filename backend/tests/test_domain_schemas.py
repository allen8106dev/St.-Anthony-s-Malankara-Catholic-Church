from datetime import datetime, timezone
from decimal import Decimal
from types import SimpleNamespace
import unittest

from pydantic import ValidationError
from app.schemas.admin import DonationCreate, DueCreate, PaymentCreate
from app.models.domain import PaymentMethod, MembershipStatus
from app.schemas.admin import MemberCreate
from app.schemas.public import PublicEvent

class FinancialSchemaTests(unittest.TestCase):
    def test_due_requires_owner(self):
        with self.assertRaises(ValidationError):
            DueCreate(title="Annual contribution", amount=Decimal("10.00"))

    def test_payment_must_be_positive(self):
        with self.assertRaises(ValidationError):
            PaymentCreate(member_id="00000000-0000-0000-0000-000000000001", amount=Decimal("0"), payment_date=datetime.now(timezone.utc), payment_method=PaymentMethod.CASH)

    def test_anonymous_donation_is_supported(self):
        donation = DonationCreate(amount=Decimal("25.00"), donated_at=datetime.now(timezone.utc))
        self.assertIsNone(donation.donor_name)

    def test_member_uses_controlled_membership_status(self):
        member = MemberCreate(first_name="Sample", last_name="Member")
        self.assertEqual(member.membership_status, MembershipStatus.ACTIVE)

    def test_public_event_projection_excludes_internal_fields(self):
        event = SimpleNamespace(
            id="00000000-0000-0000-0000-000000000001", slug="sample-event", title="Sample event",
            description=None, start_datetime=datetime.now(timezone.utc), end_datetime=None,
            location=None, image_url=None, category=None, internal_admin_note="private",
        )
        public_event = PublicEvent.model_validate(event).model_dump()
        self.assertNotIn("internal_admin_note", public_event)
