"""phase 6 member family search indexes

Revision ID: 20260831_0003
Revises: 20260831_0002
"""
from alembic import op

revision = "20260831_0003"
down_revision = "20260831_0002"
branch_labels = None
depends_on = None


def upgrade():
    # Full-name search support (case-insensitive trigram-style via lower)
    op.execute("CREATE INDEX IF NOT EXISTS ix_members_first_name_lower ON members (lower(first_name))")
    op.execute("CREATE INDEX IF NOT EXISTS ix_members_last_name_lower ON members (lower(last_name))")
    op.execute("CREATE INDEX IF NOT EXISTS ix_families_family_name_lower ON families (lower(family_name))")


def downgrade():
    op.execute("DROP INDEX IF EXISTS ix_members_first_name_lower")
    op.execute("DROP INDEX IF EXISTS ix_members_last_name_lower")
    op.execute("DROP INDEX IF EXISTS ix_families_family_name_lower")
