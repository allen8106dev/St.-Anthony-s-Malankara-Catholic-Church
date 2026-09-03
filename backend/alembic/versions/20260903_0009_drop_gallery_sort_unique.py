"""drop gallery image sort_order unique constraint

Revision ID: 20260903_0009
Revises: 20260903_0008
Create Date: 2026-09-03
"""
from alembic import op

revision = "20260903_0009"
down_revision = "20260903_0008"
branch_labels = None
depends_on = None


def upgrade():
    # Remove unique constraint -- sort_order is a display hint, not a data-integrity rule.
    # The UI now lets admins drag-to-reorder, which PATCHes images sequentially and would
    # hit transient conflicts with the old constraint.
    op.drop_constraint("uq_gallery_image_sort_order", "gallery_images", type_="unique")


def downgrade():
    op.create_unique_constraint(
        "uq_gallery_image_sort_order", "gallery_images", ["album_id", "sort_order"]
    )
