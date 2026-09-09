"""replace service times with Sunday Qurbana and Tuesday evening prayer

Revision ID: 20260909_0012
Revises: 20260909_0011
Create Date: 2026-09-09
"""
from uuid import uuid4

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import inspect

revision = "20260909_0012"
down_revision = "20260909_0011"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    status_enum = postgresql.ENUM("ACTIVE", "INACTIVE", "CANCELLED", name="service_time_status")
    status_enum.create(bind, checkfirst=True)

    columns = {col["name"] for col in inspect(bind).get_columns("service_times")}
    if "status" not in columns:
        op.add_column(
            "service_times",
            sa.Column("status", status_enum, nullable=False, server_default="ACTIVE"),
        )
        op.execute(sa.text("UPDATE service_times SET status = 'INACTIVE' WHERE is_active IS FALSE"))
        op.alter_column("service_times", "status", server_default=None)

    op.execute(sa.text("DELETE FROM service_times"))
    rows = [
        {"id": str(uuid4()), "day_of_week": 0, "start_time": "08:30:00", "service_name": "Holy Qurbana"},
        {"id": str(uuid4()), "day_of_week": 2, "start_time": "18:30:00", "service_name": "Evening Prayer"},
    ]
    for row in rows:
        bind.execute(
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


def downgrade():
    pass
