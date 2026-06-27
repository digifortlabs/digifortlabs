"""Add new ward charges

Revision ID: 606f98de6a58
Revises: e30cb1654e36
Create Date: 2026-06-26 20:18:34.341514

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '606f98de6a58'
down_revision: Union[str, None] = 'e30cb1654e36'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('wards', sa.Column('doctor_charge', sa.Float(), nullable=True))
    op.add_column('wards', sa.Column('nursing_charge', sa.Float(), nullable=True))
    op.add_column('wards', sa.Column('bio_medical_wastage_charge', sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column('wards', 'bio_medical_wastage_charge')
    op.drop_column('wards', 'nursing_charge')
    op.drop_column('wards', 'doctor_charge')
