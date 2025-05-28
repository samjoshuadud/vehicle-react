"""add_mileage_interval_to_reminders

Revision ID: 417103a36aee
Revises: e3fe50c91fd3
Create Date: 2025-05-28 22:28:08.097833

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '417103a36aee'
down_revision: Union[str, None] = 'e3fe50c91fd3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add mileage_interval column to Reminders_Info table
    op.add_column('Reminders_Info', sa.Column('mileage_interval', sa.Integer(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove mileage_interval column from Reminders_Info table
    op.drop_column('Reminders_Info', 'mileage_interval')
