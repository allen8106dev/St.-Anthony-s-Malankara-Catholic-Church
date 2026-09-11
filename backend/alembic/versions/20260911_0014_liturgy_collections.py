"""add liturgy collections and resources

Revision ID: 20260911_0014
Revises: 20260911_0013
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
revision = "20260911_0014"
down_revision = "20260911_0013"
branch_labels = depends_on = None
def upgrade():
    status = postgresql.ENUM("DRAFT", "PUBLISHED", "ARCHIVED", name="liturgy_collection_status", create_type=False); status.create(op.get_bind(), checkfirst=True)
    op.create_table("liturgy_collections", sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True), sa.Column("title", sa.String(250), nullable=False), sa.Column("description", sa.Text()), sa.Column("status", status, nullable=False, server_default="DRAFT"), sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False), sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False))
    op.create_table("liturgy_resources", sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True), sa.Column("collection_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("liturgy_collections.id", ondelete="CASCADE"), nullable=False), sa.Column("title", sa.String(250), nullable=False), sa.Column("description", sa.Text()), sa.Column("pdf_url", sa.String(2048), nullable=False), sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False), sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False))
def downgrade():
    op.drop_table("liturgy_resources"); op.drop_table("liturgy_collections"); sa.Enum(name="liturgy_collection_status").drop(op.get_bind(), checkfirst=True)
