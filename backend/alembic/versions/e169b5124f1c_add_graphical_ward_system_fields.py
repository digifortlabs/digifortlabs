"""Add graphical ward system fields

Revision ID: e169b5124f1c
Revises: cc7fe2021d9e
Create Date: 2026-05-26 23:36:57.453586

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'e169b5124f1c'
down_revision: Union[str, None] = 'cc7fe2021d9e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('ipd_admissions', sa.Column('medication_orders', sa.JSON(), nullable=True))
    op.add_column('ipd_admissions', sa.Column('medication_log', sa.JSON(), nullable=True))
    op.add_column('ipd_admissions', sa.Column('doctor_notes', sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column('ipd_admissions', 'doctor_notes')
    op.drop_column('ipd_admissions', 'medication_log')
    op.drop_column('ipd_admissions', 'medication_orders')
