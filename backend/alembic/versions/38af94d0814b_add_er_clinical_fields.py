"""Add ER clinical fields

Revision ID: 38af94d0814b
Revises: aaed1cb5cd73
Create Date: 2026-06-27 23:33:53.099630

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '38af94d0814b'
down_revision: Union[str, None] = 'aaed1cb5cd73'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('emergency_visits', sa.Column('hpi', sa.Text(), nullable=True))
    op.add_column('emergency_visits', sa.Column('allergies', sa.Text(), nullable=True))
    op.add_column('emergency_visits', sa.Column('past_history', sa.Text(), nullable=True))
    op.add_column('emergency_visits', sa.Column('abcde_assessment', sa.JSON(), nullable=True))
    op.add_column('emergency_visits', sa.Column('stat_orders', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('emergency_visits', 'stat_orders')
    op.drop_column('emergency_visits', 'abcde_assessment')
    op.drop_column('emergency_visits', 'past_history')
    op.drop_column('emergency_visits', 'allergies')
    op.drop_column('emergency_visits', 'hpi')
