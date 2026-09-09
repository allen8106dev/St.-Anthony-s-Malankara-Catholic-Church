"""add service time status and replace schedule

Revision ID: 20260909_0011
Revises: 20260906_0010
Create Date: 2026-09-09
"""
from uuid import uuid4

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260909_0011"
down_revision = "20260906_0010"
branch_labels = None
depends_on = None


def upgrade():
    status_enum = postgresql.ENUM("ACTIVE", "INACTIVE", "CANCELLED", name="service_time_status")
    status_enum.create(op.get_bind(), checkfirst=True)
    op.add_column(
        "service_times",
        sa.Column("status", status_enum, nullable=False, server_default="ACTIVE"),
    )
    op.execute(
        sa.text("UPDATE service_times SET status = 'INACTIVE' WHERE is_active IS FALSE")
    )
    op.execute(sa.text("DELETE FROM service_times"))
    conn = op.get_bind()
    rows = [
        {"id": str(uuid4()), "day_of_week": 0, "start_time": "08:30:00", "service_name": "Holy Qurbana"},
        {"id": str(uuid4()), "day_of_week": 2, "start_time": "18:30:00", "service_name": "Evening Prayer"},
    ]
    for row in rows:
        conn.execute(
            sa.text(
                """
                INSERT INTO service_times (
                    id, day_of_week, start_time, end_time, service_name,
                    location, description, is_active, sort_order, status, created_at, updated_at
                )
                VALUES (
                    CAST(:id AS uuid), :day_of_week, CAST(:start_time AS time), NULL, :service_name,
                    NULL, NULL, true, 0, CAST('ACTIVE' AS service_time_status), now(), now()
                )
                """
            ),
            row,
        )
    op.alter_column("service_times", "status", server_default=None)


def downgrade():
    op.drop_column("service_times", "status")
    sa.Enum(name="service_time_status").drop(op.get_bind(), checkfirst=True)
