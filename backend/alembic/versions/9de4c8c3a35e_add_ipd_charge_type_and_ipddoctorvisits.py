"""Add ipd_charge_type and IPDDoctorVisits

Revision ID: 9de4c8c3a35e
Revises: 606f98de6a58
Create Date: 2026-06-26 20:46:41.144887

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '9de4c8c3a35e'
down_revision: Union[str, None] = '606f98de6a58'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add ipd_charge_type to doctor_profiles
    op.add_column('doctor_profiles', sa.Column('ipd_charge_type', sa.String(), nullable=True, server_default='PER_DAY'))

    # Create ipd_doctor_visits table
    op.create_table('ipd_doctor_visits',
    sa.Column('visit_id', sa.Integer(), nullable=False),
    sa.Column('admission_id', sa.Integer(), nullable=False),
    sa.Column('doctor_id', sa.Integer(), nullable=False),
    sa.Column('visit_date', sa.DateTime(), nullable=False),
    sa.Column('charge_amount', sa.Float(), nullable=False),
    sa.Column('notes', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['admission_id'], ['ipd_admissions.admission_id'], ),
    sa.ForeignKeyConstraint(['doctor_id'], ['doctor_profiles.profile_id'], ),
    sa.PrimaryKeyConstraint('visit_id')
    )
    op.create_index(op.f('ix_ipd_doctor_visits_visit_id'), 'ipd_doctor_visits', ['visit_id'], unique=False)


def downgrade() -> None:
    # Drop ipd_doctor_visits table
    op.drop_index(op.f('ix_ipd_doctor_visits_visit_id'), table_name='ipd_doctor_visits')
    op.drop_table('ipd_doctor_visits')
    
    # Drop ipd_charge_type from doctor_profiles
    op.drop_column('doctor_profiles', 'ipd_charge_type')
