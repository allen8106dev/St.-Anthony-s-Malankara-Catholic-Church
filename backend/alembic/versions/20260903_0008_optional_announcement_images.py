"""allow text-only announcements

Revision ID: 20260903_0008
Revises: 20260903_0007
"""
from alembic import op
import sqlalchemy as sa

revision = "20260903_0008"
down_revision = "20260903_0007"
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column("announcements", "image_url", existing_type=sa.String(length=2048), nullable=True)


def downgrade():
    op.alter_column("announcements", "image_url", existing_type=sa.String(length=2048), nullable=False)
