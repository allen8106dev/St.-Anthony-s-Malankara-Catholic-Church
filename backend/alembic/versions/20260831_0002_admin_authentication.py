"""add administrator password, sessions, and audit foundation

Revision ID: 20260831_0002
Revises: 20260831_0001
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260831_0002"
down_revision = "20260831_0001"
branch_labels = None
depends_on = None

def upgrade():
    op.add_column("admin_users", sa.Column("password_hash", sa.String(length=512), nullable=True))
    op.execute("CREATE UNIQUE INDEX uq_admin_users_email_normalized ON admin_users (lower(email))")
    op.create_table("admin_sessions", sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False), sa.Column("admin_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("admin_users.id", ondelete="CASCADE"), nullable=False), sa.Column("token_hash", sa.String(length=64), nullable=False, unique=True), sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False), sa.Column("revoked_at", sa.DateTime(timezone=True)), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False))
    op.create_index("ix_admin_sessions_admin_user_id", "admin_sessions", ["admin_user_id"]); op.create_index("ix_admin_sessions_expires_at", "admin_sessions", ["expires_at"])
    op.create_table("audit_logs", sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False), sa.Column("admin_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("admin_users.id", ondelete="RESTRICT")), sa.Column("action", sa.String(length=120), nullable=False), sa.Column("entity_type", sa.String(length=100), nullable=False), sa.Column("entity_id", sa.String(length=100)), sa.Column("metadata_json", sa.JSON()), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False))
    op.create_index("ix_audit_logs_admin_user_id", "audit_logs", ["admin_user_id"]); op.create_index("ix_audit_logs_action", "audit_logs", ["action"])
    # Existing Phase 4 installations have no login credentials. Their accounts remain
    # disabled for password login until an authorized credential-reset flow is added.

def downgrade():
    op.drop_table("audit_logs"); op.drop_table("admin_sessions"); op.drop_index("uq_admin_users_email_normalized", table_name="admin_users"); op.drop_column("admin_users", "password_hash")
