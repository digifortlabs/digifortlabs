"""Add deleted_at to patient for recycle bin

Revision ID: 2f850dd0b608
Revises: f1ff203839b2
Create Date: 2026-05-28 11:18:57.277854

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '2f850dd0b608'
down_revision: Union[str, None] = 'f1ff203839b2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('patients', sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('patients', 'deleted_at')
