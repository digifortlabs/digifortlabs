"""add mrd_service_type

Revision ID: 91721405f491
Revises: e169b5124f1c
Create Date: 2026-05-27 15:20:17.191484

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '91721405f491'
down_revision: Union[str, None] = 'e169b5124f1c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('hospitals', sa.Column('mrd_service_type', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('hospitals', 'mrd_service_type')
