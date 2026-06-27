"""Add OT tracking fields to Surgery

Revision ID: aaed1cb5cd73
Revises: 8b3bcb81ed1f
Create Date: 2026-06-27 19:43:55.820805

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'aaed1cb5cd73'
down_revision: Union[str, None] = '8b3bcb81ed1f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('surgeries', sa.Column('timestamps', sa.JSON(), nullable=True))
    op.add_column('surgeries', sa.Column('implant_register', sa.JSON(), nullable=True))
    op.add_column('surgeries', sa.Column('narcotics_log', sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column('surgeries', 'narcotics_log')
    op.drop_column('surgeries', 'implant_register')
    op.drop_column('surgeries', 'timestamps')
