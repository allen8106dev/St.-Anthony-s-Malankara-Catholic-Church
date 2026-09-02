"""phase 8 finance schema expansion

Revision ID: 20260901_0005
Revises: 20260901_0004
Create Date: 2026-09-01
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260901_0005"
down_revision = "20260901_0004"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    is_postgres = bind.dialect.name == "postgresql"

    # Add new values to payment_method enum if postgres
    if is_postgres:
        op.execute("ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'UPI'")
        op.execute("ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'CHEQUE'")
        op.execute("ALTER TYPE due_status ADD VALUE IF NOT EXISTS 'CANCELLED'")

    # Add columns to dues table
    op.add_column("dues", sa.Column("due_type", sa.String(100), nullable=True))
    op.add_column("dues", sa.Column("period_start", sa.Date(), nullable=True))
    op.add_column("dues", sa.Column("period_end", sa.Date(), nullable=True))
    op.create_index("ix_dues_due_type", "dues", ["due_type"])

    # Alter payments table
    # Make member_id nullable
    op.alter_column("payments", "member_id", existing_type=postgresql.UUID(as_uuid=True) if is_postgres else sa.CHAR(32), nullable=True)

    # Add recorded_by_id column to payments
    op.add_column(
        "payments",
        sa.Column(
            "recorded_by_id",
            postgresql.UUID(as_uuid=True) if is_postgres else sa.CHAR(32),
            sa.ForeignKey("admin_users.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.create_index("ix_payments_recorded_by_id", "payments", ["recorded_by_id"])


def downgrade():
    op.drop_index("ix_payments_recorded_by_id", table_name="payments")
    op.drop_column("payments", "recorded_by_id")
    op.alter_column("payments", "member_id", nullable=False)

    op.drop_index("ix_dues_due_type", table_name="dues")
    op.drop_column("dues", "period_end")
    op.drop_column("dues", "period_start")
    op.drop_column("dues", "due_type")

