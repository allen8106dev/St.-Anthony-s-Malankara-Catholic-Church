"""reset announcements to the unified image-backed model

Revision ID: 20260903_0007
Revises: 20260902_0006
"""
from alembic import op
import sqlalchemy as sa

revision = "20260903_0007"
down_revision = "20260902_0006"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(sa.text("DELETE FROM announcements"))
    op.drop_column("announcements", "slug")
    op.drop_column("announcements", "type")
    op.drop_column("announcements", "details")
    op.drop_column("announcements", "published_at")
    op.add_column("announcements", sa.Column("created_by_id", sa.UUID(), nullable=True))
    op.create_foreign_key("fk_announcements_created_by_id", "announcements", "admin_users", ["created_by_id"], ["id"], ondelete="RESTRICT")
    op.alter_column("announcements", "image_url", existing_type=sa.String(length=2048), nullable=True)
    op.alter_column("announcements", "created_by_id", nullable=False)
    op.execute(sa.text("DROP TYPE IF EXISTS announcement_type"))


def downgrade():
    raise RuntimeError("The announcement reset is intentionally irreversible.")