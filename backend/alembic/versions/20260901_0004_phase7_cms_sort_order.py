"""phase 7 cms sort_order on service_times

Revision ID: 20260901_0004
Revises: 20260831_0003
"""
from alembic import op
import sqlalchemy as sa

revision = "20260901_0004"
down_revision = "20260831_0003"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("service_times", sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"))


def downgrade():
    op.drop_column("service_times", "sort_order")
