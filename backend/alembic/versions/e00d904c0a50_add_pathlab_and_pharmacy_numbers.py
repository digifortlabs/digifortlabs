"""Add pathlab and pharmacy numbers

Revision ID: e00d904c0a50
Revises: 38af94d0814b
Create Date: 2026-07-07 15:17:39.347739

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e00d904c0a50'
down_revision: Union[str, None] = '38af94d0814b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # lab_orders
    with op.batch_alter_table('lab_orders', schema=None) as batch_op:
        batch_op.add_column(sa.Column('order_number', sa.String(), nullable=True))
        batch_op.create_index(batch_op.f('ix_lab_orders_order_number'), ['order_number'], unique=False)

    # pharmacy_direct_sales
    with op.batch_alter_table('pharmacy_direct_sales', schema=None) as batch_op:
        batch_op.add_column(sa.Column('bill_number', sa.String(), nullable=True))
        batch_op.create_index(batch_op.f('ix_pharmacy_direct_sales_bill_number'), ['bill_number'], unique=False)

    # pharmacy_dispenses
    with op.batch_alter_table('pharmacy_dispenses', schema=None) as batch_op:
        batch_op.add_column(sa.Column('dispense_number', sa.String(), nullable=True))
        batch_op.create_index(batch_op.f('ix_pharmacy_dispenses_dispense_number'), ['dispense_number'], unique=False)


def downgrade() -> None:
    with op.batch_alter_table('pharmacy_dispenses', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_pharmacy_dispenses_dispense_number'))
        batch_op.drop_column('dispense_number')

    with op.batch_alter_table('pharmacy_direct_sales', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_pharmacy_direct_sales_bill_number'))
        batch_op.drop_column('bill_number')

    with op.batch_alter_table('lab_orders', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_lab_orders_order_number'))
        batch_op.drop_column('order_number')
