"""Merge heads

Revision ID: 5750a93576f8
Revises: ('5fe30412d7d4', 'f8a111111111')
Create Date: 2026-06-06 13:02:06.630644

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5750a93576f8'
down_revision: Union[str, None] = ('5fe30412d7d4', 'f8a111111111')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
