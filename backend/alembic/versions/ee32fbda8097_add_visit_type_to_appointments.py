"""add_visit_type_to_appointments

Revision ID: ee32fbda8097
Revises: 91721405f491
Create Date: 2026-05-27 15:39:06.546588

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ee32fbda8097'
down_revision: Union[str, None] = '91721405f491'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('appointments', sa.Column('visit_type', sa.String(), server_default='OPD', nullable=True))
    op.add_column('appointments', sa.Column('is_follow_up', sa.Boolean(), server_default='false', nullable=True))


def downgrade() -> None:
    op.drop_column('appointments', 'is_follow_up')
    op.drop_column('appointments', 'visit_type')
