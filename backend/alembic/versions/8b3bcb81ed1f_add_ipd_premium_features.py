"""Add IPD premium features

Revision ID: 8b3bcb81ed1f
Revises: 9de4c8c3a35e
Create Date: 2026-06-26 21:18:15.789201

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '8b3bcb81ed1f'
down_revision: Union[str, None] = '9de4c8c3a35e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('ipd_admissions', sa.Column('diet_orders', sa.JSON(), nullable=True))
    op.add_column('ipd_admissions', sa.Column('bed_history', sa.JSON(), nullable=True))
    op.add_column('ipd_admissions', sa.Column('medical_cleared', sa.Boolean(), nullable=True))
    op.add_column('ipd_admissions', sa.Column('pharmacy_cleared', sa.Boolean(), nullable=True))
    op.add_column('ipd_admissions', sa.Column('billing_cleared', sa.Boolean(), nullable=True))


def downgrade() -> None:
    op.drop_column('ipd_admissions', 'billing_cleared')
    op.drop_column('ipd_admissions', 'pharmacy_cleared')
    op.drop_column('ipd_admissions', 'medical_cleared')
    op.drop_column('ipd_admissions', 'bed_history')
    op.drop_column('ipd_admissions', 'diet_orders')
