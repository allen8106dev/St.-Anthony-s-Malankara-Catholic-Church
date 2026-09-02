"""Private-domain schemas for authorized admin routes; never mounted publicly."""
from datetime import date, datetime
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator
from app.models.domain import DueStatus, MembershipStatus, PaymentMethod, PaymentStatus, RelationshipType

class AdminModel(BaseModel): model_config = ConfigDict(from_attributes=True)

# ── Family ──────────────────────────────────────────────────────────────────
class FamilyCreate(BaseModel):
    family_name: str = Field(min_length=1, max_length=200)
    address: str | None = None
    notes: str | None = None

class FamilyUpdate(BaseModel):
    family_name: str | None = Field(default=None, min_length=1, max_length=200)
    address: str | None = None
    notes: str | None = None

class FamilyRead(AdminModel):
    id: UUID
    family_name: str
    address: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime

class FamilyListItem(AdminModel):
    id: UUID
    family_name: str
    address: str | None
    member_count: int

class FamilyDetail(AdminModel):
    id: UUID
    family_name: str
    address: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime
    members: list["MemberListItem"]

# ── Member ───────────────────────────────────────────────────────────────────
class MemberCreate(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    middle_name: str | None = Field(default=None, max_length=100)
    date_of_birth: date | None = None
    phone: str | None = Field(default=None, max_length=50)
    email: str | None = Field(default=None, max_length=320)
    address: str | None = None
    photo_url: str | None = Field(default=None, max_length=2048)
    membership_status: MembershipStatus = MembershipStatus.ACTIVE
    date_joined: date | None = None
    notes: str | None = None
    family_id: UUID | None = None

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str | None) -> str | None:
        return v.strip().casefold() if v else v

class MemberUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, min_length=1, max_length=100)
    middle_name: str | None = Field(default=None, max_length=100)
    date_of_birth: date | None = None
    phone: str | None = Field(default=None, max_length=50)
    email: str | None = Field(default=None, max_length=320)
    address: str | None = None
    photo_url: str | None = Field(default=None, max_length=2048)
    membership_status: MembershipStatus | None = None
    date_joined: date | None = None
    notes: str | None = None
    family_id: UUID | None = None

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str | None) -> str | None:
        return v.strip().casefold() if v else v

class MemberListItem(AdminModel):
    id: UUID
    first_name: str
    middle_name: str | None
    last_name: str
    membership_status: MembershipStatus
    phone: str | None
    email: str | None
    family_id: UUID | None
    family_name: str | None = None

class MemberRead(AdminModel):
    id: UUID
    first_name: str
    middle_name: str | None
    last_name: str
    date_of_birth: date | None
    phone: str | None
    email: str | None
    address: str | None
    photo_url: str | None
    membership_status: MembershipStatus
    date_joined: date | None
    notes: str | None
    family_id: UUID | None
    family_name: str | None = None
    created_at: datetime
    updated_at: datetime

# ── Pagination ───────────────────────────────────────────────────────────────
class PaginatedMembers(BaseModel):
    items: list[MemberListItem]
    total: int
    page: int
    page_size: int
    pages: int

class PaginatedFamilies(BaseModel):
    items: list[FamilyListItem]
    total: int
    page: int
    page_size: int
    pages: int

# ── Relationship ─────────────────────────────────────────────────────────────
class RelationshipCreate(BaseModel):
    member_b_id: UUID
    relationship_type: RelationshipType

class RelationshipRead(AdminModel):
    id: UUID
    member_a_id: UUID
    relationship_type: RelationshipType
    member_b_id: UUID

# ── Finance ───────────────────────────────────────────────────────────────────
class DueCreate(BaseModel):
    member_id: UUID | None = None
    family_id: UUID | None = None
    title: str = Field(min_length=1, max_length=200)
    due_type: str | None = Field(default=None, max_length=100)
    description: str | None = None
    amount: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    due_date: date | None = None
    period_start: date | None = None
    period_end: date | None = None
    status: DueStatus = DueStatus.PENDING

    @model_validator(mode="after")
    def has_owner(self):
        if not self.member_id and not self.family_id:
            raise ValueError("A due must belong to a member or family.")
        return self

class DueUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    due_type: str | None = Field(default=None, max_length=100)
    description: str | None = None
    amount: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    due_date: date | None = None
    period_start: date | None = None
    period_end: date | None = None
    status: DueStatus | None = None

class DueListItem(AdminModel):
    id: UUID
    member_id: UUID | None
    member_name: str | None = None
    family_id: UUID | None
    family_name: str | None = None
    title: str
    due_type: str | None
    amount: Decimal
    amount_paid: Decimal
    outstanding: Decimal
    due_date: date | None
    status: DueStatus
    created_at: datetime

class DueRead(AdminModel):
    id: UUID
    member_id: UUID | None
    member_name: str | None = None
    family_id: UUID | None
    family_name: str | None = None
    title: str
    due_type: str | None
    description: str | None
    amount: Decimal
    amount_paid: Decimal
    outstanding: Decimal
    due_date: date | None
    period_start: date | None
    period_end: date | None
    status: DueStatus
    created_at: datetime
    updated_at: datetime

class PaymentCreate(BaseModel):
    member_id: UUID | None = None
    due_id: UUID | None = None
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    payment_date: datetime
    payment_method: PaymentMethod
    reference: str | None = Field(default=None, max_length=255)
    notes: str | None = None

class PaymentListItem(AdminModel):
    id: UUID
    member_id: UUID | None
    member_name: str | None = None
    family_name: str | None = None
    due_id: UUID | None
    due_title: str | None = None
    amount: Decimal
    payment_date: datetime
    payment_method: PaymentMethod
    reference: str | None
    status: PaymentStatus
    recorded_by_id: UUID | None = None
    recorded_by_name: str | None = None
    created_at: datetime

class PaymentRead(AdminModel):
    id: UUID
    member_id: UUID | None
    member_name: str | None = None
    family_name: str | None = None
    due_id: UUID | None
    due_title: str | None = None
    amount: Decimal
    payment_date: datetime
    payment_method: PaymentMethod
    reference: str | None
    status: PaymentStatus
    notes: str | None
    recorded_by_id: UUID | None = None
    recorded_by_name: str | None = None
    created_at: datetime

class DueDetail(DueRead):
    payments: list[PaymentListItem] = []

class PaginatedDues(BaseModel):
    items: list[DueListItem]
    total: int
    page: int
    page_size: int
    pages: int

class PaginatedPayments(BaseModel):
    items: list[PaymentListItem]
    total: int
    page: int
    page_size: int
    pages: int

class FinanceSummary(BaseModel):
    total_outstanding: Decimal
    total_collected: Decimal
    count_unpaid: int
    count_partially_paid: int
    count_paid: int
    count_overdue: int
    recent_payments: list[PaymentListItem]

class DonationCreate(BaseModel):
    donor_name: str | None = Field(default=None, max_length=200)
    donor_email: str | None = None
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    purpose: str | None = Field(default=None, max_length=200)
    payment_method: PaymentMethod | None = None
    transaction_reference: str | None = Field(default=None, max_length=255)
    donated_at: datetime

class DonationRead(AdminModel):
    id: UUID
    donor_name: str | None
    donor_email: str | None
    amount: Decimal
    purpose: str | None
    donated_at: datetime

FamilyDetail.model_rebuild()
DueDetail.model_rebuild()


# ── Admin Dashboard ───────────────────────────────────────────────────────────
class AdminDashboard(BaseModel):
    total_members: int
    active_members: int
    total_families: int
    outstanding_dues: Decimal
    total_collected: Decimal
    overdue_dues: int
    upcoming_events: int
    active_announcements: int
    recent_payments: list[PaymentListItem]
    donations_on_hold: bool = True
