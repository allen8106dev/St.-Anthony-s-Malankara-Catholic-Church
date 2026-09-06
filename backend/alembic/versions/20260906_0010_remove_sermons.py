"""remove sermons and sermon series

Revision ID: 20260906_0010
Revises: 20260903_0009
Create Date: 2026-09-06
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260906_0010"
down_revision = "20260903_0009"
branch_labels = None
depends_on = None


def upgrade():
    for idx in ("ix_sermons_date", "ix_sermons_series_id", "ix_sermons_slug"):
        op.drop_index(idx, table_name="sermons", if_exists=True)
    op.drop_table("sermons")
    op.drop_table("sermon_series")
    sa.Enum(name="sermon_status").drop(op.get_bind(), checkfirst=True)


def downgrade():
    sermon_status = sa.Enum("DRAFT", "PUBLISHED", "ARCHIVED", name="sermon_status")
    sermon_status.create(op.get_bind(), checkfirst=True)
    op.create_table(
        "sermon_series",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(250), nullable=False, unique=True),
        sa.Column("description", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "sermons",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("series_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("sermon_series.id", ondelete="SET NULL")),
        sa.Column("title", sa.String(250), nullable=False),
        sa.Column("slug", sa.String(250), nullable=False, unique=True),
        sa.Column("speaker_name", sa.String(200)),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("scripture_reference", sa.String(500)),
        sa.Column("description", sa.Text()),
        sa.Column("video_url", sa.String(2048)),
        sa.Column("thumbnail_url", sa.String(2048)),
        sa.Column("status", sermon_status, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_sermons_slug", "sermons", ["slug"])
    op.create_index("ix_sermons_series_id", "sermons", ["series_id"])
    op.create_index("ix_sermons_date", "sermons", ["date"])
