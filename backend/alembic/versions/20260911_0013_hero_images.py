"""add homepage hero images table

Revision ID: 20260911_0013
Revises: 20260909_0012
Create Date: 2026-09-11
"""
from uuid import uuid4

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260911_0013"
down_revision = "20260909_0012"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "hero_images",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("image_url", sa.String(length=2048), nullable=False),
        sa.Column("alt_text", sa.String(length=500), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    bind = op.get_bind()
    rows = bind.execute(sa.text(
        """
        SELECT image_url FROM page_content
        WHERE page = 'homepage' AND section = 'hero'
          AND image_url IS NOT NULL AND image_url <> ''
        """
    )).fetchall()
    for index, row in enumerate(rows):
        bind.execute(
            sa.text(
                """
                INSERT INTO hero_images (id, image_url, alt_text, sort_order)
                VALUES (:id, :image_url, :alt_text, :sort_order)
                """
            ),
            {
                "id": str(uuid4()),
                "image_url": row[0],
                "alt_text": "Homepage hero",
                "sort_order": index,
            },
        )


def downgrade():
    op.drop_table("hero_images")
