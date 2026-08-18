"""Add all missing columns

Revision ID: 12f4756b64c0
Revises: e00d904c0a50
Create Date: 2026-07-07 15:23:21.212334

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '12f4756b64c0'
down_revision: Union[str, None] = 'e00d904c0a50'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    
    def col_exists(table, col):
        try:
            return any(c['name'] == col for c in insp.get_columns(table))
        except Exception:
            return False

    with op.batch_alter_table('communication_logs', schema=None) as batch_op:
        pass

    if not col_exists('dental_3d_scans', 'patient_id'):
        with op.batch_alter_table('dental_3d_scans', schema=None) as batch_op:
            batch_op.add_column(sa.Column('patient_id', sa.Integer(), nullable=False))

    with op.batch_alter_table('dental_lab_orders', schema=None) as batch_op:
        pass

    if not col_exists('dental_treatment_plans', 'patient_id'):
        with op.batch_alter_table('dental_treatment_plans', schema=None) as batch_op:
            batch_op.add_column(sa.Column('patient_id', sa.Integer(), nullable=False))

    with op.batch_alter_table('doctor_profiles', schema=None) as batch_op:
        if not col_exists('doctor_profiles', 'ipd_charge'):
            batch_op.add_column(sa.Column('ipd_charge', sa.Float(), nullable=True))
        if not col_exists('doctor_profiles', 'ipd_charge_type'):
            batch_op.add_column(sa.Column('ipd_charge_type', sa.String(), nullable=True))
        if not col_exists('doctor_profiles', 'is_residential'):
            batch_op.add_column(sa.Column('is_residential', sa.Boolean(), nullable=True))

    with op.batch_alter_table('doctor_schedules', schema=None) as batch_op:
        if not col_exists('doctor_schedules', 'session_type'):
            batch_op.add_column(sa.Column('session_type', sa.String(), nullable=True))

    with op.batch_alter_table('hospitals', schema=None) as batch_op:
        if not col_exists('hospitals', 'id_generation_settings'):
            batch_op.add_column(sa.Column('id_generation_settings', sa.JSON(), nullable=True))
        if not col_exists('hospitals', 'trial_ends_at'):
            batch_op.add_column(sa.Column('trial_ends_at', sa.DateTime(), nullable=True))
        if not col_exists('hospitals', 'is_onboarded'):
            batch_op.add_column(sa.Column('is_onboarded', sa.Boolean(), nullable=True))
        if not col_exists('hospitals', 'patient_registration_fee'):
            batch_op.add_column(sa.Column('patient_registration_fee', sa.Float(), nullable=True))
        if not col_exists('hospitals', 'nursing_base_charge'):
            batch_op.add_column(sa.Column('nursing_base_charge', sa.Float(), nullable=True))
        if not col_exists('hospitals', 'ot_base_charge'):
            batch_op.add_column(sa.Column('ot_base_charge', sa.Float(), nullable=True))

    with op.batch_alter_table('insurance_claims', schema=None) as batch_op:
        pass

    with op.batch_alter_table('ipd_admissions', schema=None) as batch_op:
        if not col_exists('ipd_admissions', 'fluid_balance_log'):
            batch_op.add_column(sa.Column('fluid_balance_log', sa.JSON(), nullable=True))
        if not col_exists('ipd_admissions', 'pre_op_assessment'):
            batch_op.add_column(sa.Column('pre_op_assessment', sa.JSON(), nullable=True))
        if not col_exists('ipd_admissions', 'post_op_assessment'):
            batch_op.add_column(sa.Column('post_op_assessment', sa.JSON(), nullable=True))
        if not col_exists('ipd_admissions', 'diet_orders'):
            batch_op.add_column(sa.Column('diet_orders', sa.JSON(), nullable=True))
        if not col_exists('ipd_admissions', 'bed_history'):
            batch_op.add_column(sa.Column('bed_history', sa.JSON(), nullable=True))
        if not col_exists('ipd_admissions', 'medical_cleared'):
            batch_op.add_column(sa.Column('medical_cleared', sa.Boolean(), nullable=True))
        if not col_exists('ipd_admissions', 'pharmacy_cleared'):
            batch_op.add_column(sa.Column('pharmacy_cleared', sa.Boolean(), nullable=True))
        if not col_exists('ipd_admissions', 'billing_cleared'):
            batch_op.add_column(sa.Column('billing_cleared', sa.Boolean(), nullable=True))
        if not col_exists('ipd_admissions', 'ot_required'):
            batch_op.add_column(sa.Column('ot_required', sa.Boolean(), nullable=True))
        if not col_exists('ipd_admissions', 'is_mediclaim'):
            batch_op.add_column(sa.Column('is_mediclaim', sa.Boolean(), nullable=True))
        if not col_exists('ipd_admissions', 'mediclaim_details'):
            batch_op.add_column(sa.Column('mediclaim_details', sa.String(), nullable=True))

    with op.batch_alter_table('opd_visits', schema=None) as batch_op:
        if not col_exists('opd_visits', 'is_mediclaim'):
            batch_op.add_column(sa.Column('is_mediclaim', sa.Boolean(), nullable=True))
        if not col_exists('opd_visits', 'mediclaim_details'):
            batch_op.add_column(sa.Column('mediclaim_details', sa.String(), nullable=True))

    with op.batch_alter_table('operation_theaters', schema=None) as batch_op:
        if not col_exists('operation_theaters', 'current_surgery_name'):
            batch_op.add_column(sa.Column('current_surgery_name', sa.String(), nullable=True))
        if not col_exists('operation_theaters', 'current_anesthesia_type'):
            batch_op.add_column(sa.Column('current_anesthesia_type', sa.String(), nullable=True))
        if not col_exists('operation_theaters', 'anesthesiologist_id'):
            batch_op.add_column(sa.Column('anesthesiologist_id', sa.Integer(), nullable=True))
        if not col_exists('operation_theaters', 'current_diagnosis'):
            batch_op.add_column(sa.Column('current_diagnosis', sa.Text(), nullable=True))
        if not col_exists('operation_theaters', 'special_requirements'):
            batch_op.add_column(sa.Column('special_requirements', sa.Text(), nullable=True))

    with op.batch_alter_table('ortho_records', schema=None) as batch_op:
        pass

    with op.batch_alter_table('patients', schema=None) as batch_op:
        if not col_exists('patients', 'deleted_at'):
            batch_op.add_column(sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True))

    if not col_exists('periodontal_exams', 'patient_id'):
        with op.batch_alter_table('periodontal_exams', schema=None) as batch_op:
            batch_op.add_column(sa.Column('patient_id', sa.Integer(), nullable=False))

    with op.batch_alter_table('users', schema=None) as batch_op:
        if not col_exists('users', 'mfa_enabled'):
            batch_op.add_column(sa.Column('mfa_enabled', sa.Boolean(), nullable=True))
        if not col_exists('users', 'subdomain'):
            batch_op.add_column(sa.Column('subdomain', sa.String(), nullable=True))
            batch_op.create_index(batch_op.f('ix_users_subdomain'), ['subdomain'], unique=True)

    with op.batch_alter_table('wards', schema=None) as batch_op:
        if not col_exists('wards', 'daily_charge'):
            batch_op.add_column(sa.Column('daily_charge', sa.Float(), nullable=True))
        if not col_exists('wards', 'doctor_charge'):
            batch_op.add_column(sa.Column('doctor_charge', sa.Float(), nullable=True))
        if not col_exists('wards', 'nursing_charge'):
            batch_op.add_column(sa.Column('nursing_charge', sa.Float(), nullable=True))
        if not col_exists('wards', 'bio_medical_wastage_charge'):
            batch_op.add_column(sa.Column('bio_medical_wastage_charge', sa.Float(), nullable=True))

    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('wards', schema=None) as batch_op:
        pass

    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_users_subdomain'))

    with op.batch_alter_table('periodontal_exams', schema=None) as batch_op:
        pass

    with op.batch_alter_table('patients', schema=None) as batch_op:
        pass

    with op.batch_alter_table('ortho_records', schema=None) as batch_op:
        pass

    with op.batch_alter_table('operation_theaters', schema=None) as batch_op:
        pass

    with op.batch_alter_table('opd_visits', schema=None) as batch_op:
        pass

    with op.batch_alter_table('ipd_admissions', schema=None) as batch_op:
        pass

    with op.batch_alter_table('insurance_claims', schema=None) as batch_op:
        pass

    with op.batch_alter_table('hospitals', schema=None) as batch_op:
        pass

    with op.batch_alter_table('doctor_schedules', schema=None) as batch_op:
        pass

    with op.batch_alter_table('doctor_profiles', schema=None) as batch_op:
        pass

    with op.batch_alter_table('dental_treatment_plans', schema=None) as batch_op:
        pass

    with op.batch_alter_table('dental_lab_orders', schema=None) as batch_op:
        pass

    with op.batch_alter_table('dental_3d_scans', schema=None) as batch_op:
        pass

    with op.batch_alter_table('communication_logs', schema=None) as batch_op:
        pass

    # ### end Alembic commands ###
