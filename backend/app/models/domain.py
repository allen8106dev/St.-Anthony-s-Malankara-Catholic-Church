"""Core church-platform domain models. All timestamps are UTC-aware."""
import enum
import uuid
from datetime import date, datetime, time
from decimal import Decimal

from sqlalchemy import Boolean, CheckConstraint, Date, DateTime, Enum, ForeignKey, Index, Integer, JSON, Numeric, String, Text, Time, UniqueConstraint, func, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Timestamped:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class RoleName(str, enum.Enum): SUPER_ADMIN = "SUPER_ADMIN"; CONTENT_ADMIN = "CONTENT_ADMIN"; MEMBER_ADMIN = "MEMBER_ADMIN"; TREASURER = "TREASURER"
class MembershipStatus(str, enum.Enum): ACTIVE = "ACTIVE"; INACTIVE = "INACTIVE"; TRANSFERRED = "TRANSFERRED"; DECEASED = "DECEASED"; OTHER = "OTHER"
class RelationshipType(str, enum.Enum): PARENT = "PARENT"; CHILD = "CHILD"; SPOUSE = "SPOUSE"; SIBLING = "SIBLING"; GUARDIAN = "GUARDIAN"; OTHER = "OTHER"
class DueStatus(str, enum.Enum): PENDING = "PENDING"; PARTIALLY_PAID = "PARTIALLY_PAID"; PAID = "PAID"; WAIVED = "WAIVED"; OVERDUE = "OVERDUE"; CANCELLED = "CANCELLED"
class PaymentStatus(str, enum.Enum): PENDING = "PENDING"; COMPLETED = "COMPLETED"; VOID = "VOID"; FAILED = "FAILED"
class PaymentMethod(str, enum.Enum): CASH = "CASH"; BANK_TRANSFER = "BANK_TRANSFER"; UPI = "UPI"; CHEQUE = "CHEQUE"; ONLINE = "ONLINE"; OTHER = "OTHER"
class PublicationStatus(str, enum.Enum): DRAFT = "DRAFT"; PUBLISHED = "PUBLISHED"; ARCHIVED = "ARCHIVED"
class EventStatus(str, enum.Enum): DRAFT = "DRAFT"; PUBLISHED = "PUBLISHED"; CANCELLED = "CANCELLED"; COMPLETED = "COMPLETED"
class Role(Base, Timestamped):
    __tablename__ = "roles"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[RoleName] = mapped_column(Enum(RoleName, name="role_name"), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    admin_users: Mapped[list["AdminUser"]] = relationship(back_populates="role")

class AdminUser(Base, Timestamped):
    __tablename__ = "admin_users"
    __table_args__ = (Index("uq_admin_users_email_normalized", text("lower(email)"), unique=True),)
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    auth_subject: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str | None] = mapped_column(String(512))
    role_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("roles.id", ondelete="RESTRICT"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    role: Mapped[Role] = relationship(back_populates="admin_users")

class AdminSession(Base):
    __tablename__ = "admin_sessions"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    admin_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("admin_users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    admin_user: Mapped[AdminUser] = relationship()

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    admin_user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("admin_users.id", ondelete="RESTRICT"), index=True)
    action: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_id: Mapped[str | None] = mapped_column(String(100))
    metadata_json: Mapped[dict | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

class Family(Base, Timestamped):
    __tablename__ = "families"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    family_name: Mapped[str] = mapped_column(String(200), index=True, nullable=False)
    address: Mapped[str | None] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)
    members: Mapped[list["Member"]] = relationship(back_populates="family")

class Member(Base, Timestamped):
    __tablename__ = "members"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    middle_name: Mapped[str | None] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    date_of_birth: Mapped[date | None] = mapped_column(Date)
    phone: Mapped[str | None] = mapped_column(String(50))
    email: Mapped[str | None] = mapped_column(String(320), index=True)
    address: Mapped[str | None] = mapped_column(Text)
    photo_url: Mapped[str | None] = mapped_column(String(2048))
    membership_status: Mapped[MembershipStatus] = mapped_column(Enum(MembershipStatus, name="membership_status"), default=MembershipStatus.ACTIVE, index=True, nullable=False)
    date_joined: Mapped[date | None] = mapped_column(Date)
    notes: Mapped[str | None] = mapped_column(Text)
    family_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("families.id", ondelete="SET NULL"), index=True)
    family: Mapped[Family | None] = relationship(back_populates="members")

class MemberRelationship(Base, Timestamped):
    __tablename__ = "member_relationships"
    __table_args__ = (UniqueConstraint("member_a_id", "relationship_type", "member_b_id", name="uq_member_relationship"), CheckConstraint("member_a_id <> member_b_id", name="ck_relationship_distinct_members"))
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    member_a_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("members.id", ondelete="RESTRICT"), nullable=False)
    relationship_type: Mapped[RelationshipType] = mapped_column(Enum(RelationshipType, name="relationship_type"), nullable=False)
    member_b_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("members.id", ondelete="RESTRICT"), nullable=False)

class Due(Base, Timestamped):
    __tablename__ = "dues"
    __table_args__ = (CheckConstraint("amount >= 0", name="ck_due_nonnegative_amount"), CheckConstraint("member_id IS NOT NULL OR family_id IS NOT NULL", name="ck_due_owner"))
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    member_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("members.id", ondelete="RESTRICT"), index=True)
    family_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("families.id", ondelete="RESTRICT"), index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    due_type: Mapped[str | None] = mapped_column(String(100), index=True)
    description: Mapped[str | None] = mapped_column(Text)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    due_date: Mapped[date | None] = mapped_column(Date)
    period_start: Mapped[date | None] = mapped_column(Date)
    period_end: Mapped[date | None] = mapped_column(Date)
    status: Mapped[DueStatus] = mapped_column(Enum(DueStatus, name="due_status"), default=DueStatus.PENDING, index=True, nullable=False)

    member: Mapped[Member | None] = relationship()
    family: Mapped[Family | None] = relationship()
    payments: Mapped[list["Payment"]] = relationship(back_populates="due", order_by="Payment.payment_date.desc()")

class Payment(Base):
    __tablename__ = "payments"
    __table_args__ = (CheckConstraint("amount > 0", name="ck_payment_positive_amount"),)
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    member_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("members.id", ondelete="RESTRICT"), index=True)
    due_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("dues.id", ondelete="RESTRICT"), index=True)
    recorded_by_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("admin_users.id", ondelete="SET NULL"), index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    payment_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    payment_method: Mapped[PaymentMethod] = mapped_column(Enum(PaymentMethod, name="payment_method"), nullable=False)
    reference: Mapped[str | None] = mapped_column(String(255), index=True)
    status: Mapped[PaymentStatus] = mapped_column(Enum(PaymentStatus, name="payment_status"), default=PaymentStatus.COMPLETED, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    member: Mapped[Member | None] = relationship()
    due: Mapped[Due | None] = relationship(back_populates="payments")
    recorded_by: Mapped[AdminUser | None] = relationship()

class Donation(Base):
    __tablename__ = "donations"
    __table_args__ = (CheckConstraint("amount > 0", name="ck_donation_positive_amount"),)
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    donor_name: Mapped[str | None] = mapped_column(String(200))
    donor_email: Mapped[str | None] = mapped_column(String(320))
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    purpose: Mapped[str | None] = mapped_column(String(200))
    payment_status: Mapped[PaymentStatus] = mapped_column(Enum(PaymentStatus, name="donation_payment_status"), default=PaymentStatus.PENDING, nullable=False)
    payment_method: Mapped[PaymentMethod | None] = mapped_column(Enum(PaymentMethod, name="donation_payment_method"))
    transaction_reference: Mapped[str | None] = mapped_column(String(255), index=True)
    donated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

class Event(Base, Timestamped):
    __tablename__ = "events"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(250), nullable=False)
    slug: Mapped[str] = mapped_column(String(250), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    start_datetime: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)
    end_datetime: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    location: Mapped[str | None] = mapped_column(String(250))
    image_url: Mapped[str | None] = mapped_column(String(2048))
    category: Mapped[str | None] = mapped_column(String(100), index=True)
    status: Mapped[EventStatus] = mapped_column(Enum(EventStatus, name="event_status"), default=EventStatus.DRAFT, nullable=False)

class Announcement(Base, Timestamped):
    __tablename__ = "announcements"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(250), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    image_url: Mapped[str | None] = mapped_column(String(2048))
    created_by_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("admin_users.id", ondelete="RESTRICT"), nullable=False, index=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    status: Mapped[PublicationStatus] = mapped_column(Enum(PublicationStatus, name="announcement_status"), default=PublicationStatus.DRAFT, nullable=False)
    created_by: Mapped[AdminUser] = relationship()

class GalleryAlbum(Base, Timestamped):
    __tablename__ = "gallery_albums"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(250), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    cover_image_url: Mapped[str | None] = mapped_column(String(2048))
    status: Mapped[PublicationStatus] = mapped_column(Enum(PublicationStatus, name="gallery_album_status"), default=PublicationStatus.DRAFT, nullable=False)
    images: Mapped[list["GalleryImage"]] = relationship(back_populates="album", cascade="all, delete-orphan", order_by="GalleryImage.sort_order")

class GalleryImage(Base):
    __tablename__ = "gallery_images"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    album_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("gallery_albums.id", ondelete="CASCADE"), nullable=False)
    image_url: Mapped[str] = mapped_column(String(2048), nullable=False)
    alt_text: Mapped[str] = mapped_column(String(500), nullable=False)
    caption: Mapped[str | None] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    album: Mapped[GalleryAlbum] = relationship(back_populates="images")

class SermonSeries(Base, Timestamped):
    __tablename__ = "sermon_series"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(250), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    sermons: Mapped[list["Sermon"]] = relationship(back_populates="series")

class Sermon(Base, Timestamped):
    __tablename__ = "sermons"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    series_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("sermon_series.id", ondelete="SET NULL"), index=True)
    title: Mapped[str] = mapped_column(String(250), nullable=False)
    slug: Mapped[str] = mapped_column(String(250), unique=True, index=True, nullable=False)
    speaker_name: Mapped[str | None] = mapped_column(String(200))
    date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    scripture_reference: Mapped[str | None] = mapped_column(String(500))
    description: Mapped[str | None] = mapped_column(Text)
    video_url: Mapped[str | None] = mapped_column(String(2048))
    thumbnail_url: Mapped[str | None] = mapped_column(String(2048))
    status: Mapped[PublicationStatus] = mapped_column(Enum(PublicationStatus, name="sermon_status"), default=PublicationStatus.DRAFT, nullable=False)
    series: Mapped[SermonSeries | None] = relationship(back_populates="sermons")

class PageContent(Base, Timestamped):
    __tablename__ = "page_content"
    __table_args__ = (UniqueConstraint("page", "section", name="uq_page_content_section"),)
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    page: Mapped[str] = mapped_column(String(100), nullable=False)
    section: Mapped[str] = mapped_column(String(100), nullable=False)
    heading: Mapped[str | None] = mapped_column(String(300))
    body: Mapped[str | None] = mapped_column(Text)
    image_url: Mapped[str | None] = mapped_column(String(2048))
    status: Mapped[PublicationStatus] = mapped_column(Enum(PublicationStatus, name="page_content_status"), default=PublicationStatus.DRAFT, nullable=False)

class SiteSetting(Base, Timestamped):
    __tablename__ = "site_settings"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    is_public: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

class ServiceTime(Base, Timestamped):
    __tablename__ = "service_times"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time | None] = mapped_column(Time)
    service_name: Mapped[str] = mapped_column(String(200), nullable=False)
    location: Mapped[str | None] = mapped_column(String(250))
    description: Mapped[str | None] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
