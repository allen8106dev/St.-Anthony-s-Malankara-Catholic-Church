"""add structured announcement details

Revision ID: 20260902_0006
Revises: 20260901_0005
"""
from alembic import op
import sqlalchemy as sa

revision = "20260902_0006"
down_revision = "20260901_0005"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("announcements", sa.Column("details", sa.JSON(), nullable=True))


def downgrade():
    op.drop_column("announcements", "details")