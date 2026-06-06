
"""Restore missing columns dropped by merge conflict

Revision ID: f8a111111111
Revises: f7258259925e
Create Date: 2026-06-06 13:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f8a111111111'
down_revision: Union[str, None] = 'f7258259925e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add back columns to treatment_cycles
    op.add_column('treatment_cycles', sa.Column('labs_uploaded', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('treatment_cycles', sa.Column('ai_fit_check_passed', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('treatment_cycles', sa.Column('pharmacy_vials_approved', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('treatment_cycles', sa.Column('ready_for_booking', sa.Boolean(), server_default='false', nullable=False))
    
    # Add back appointment_id to treatment_plans
    op.add_column('treatment_plans', sa.Column('appointment_id', sa.Integer(), nullable=True))
    op.create_foreign_key('treatment_plans_appointment_id_fkey', 'treatment_plans', 'appointments', ['appointment_id'], ['id'], ondelete='SET NULL')


def downgrade() -> None:
    op.drop_constraint('treatment_plans_appointment_id_fkey', 'treatment_plans', type_='foreignkey')
    op.drop_column('treatment_plans', 'appointment_id')
    op.drop_column('treatment_cycles', 'ready_for_booking')
    op.drop_column('treatment_cycles', 'pharmacy_vials_approved')
    op.drop_column('treatment_cycles', 'ai_fit_check_passed')
    op.drop_column('treatment_cycles', 'labs_uploaded')
