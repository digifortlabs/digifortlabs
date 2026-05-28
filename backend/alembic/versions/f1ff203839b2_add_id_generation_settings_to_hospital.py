"""Add id_generation_settings to Hospital

Revision ID: f1ff203839b2
Revises: ee32fbda8097
Create Date: 2026-05-28 08:45:06.773627

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f1ff203839b2'
down_revision: Union[str, None] = 'ee32fbda8097'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('hospitals', sa.Column('id_generation_settings', sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column('hospitals', 'id_generation_settings')
