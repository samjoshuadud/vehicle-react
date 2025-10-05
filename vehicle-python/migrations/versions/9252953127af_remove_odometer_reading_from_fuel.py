"""remove_odometer_reading_from_fuel

Revision ID: 9252953127af
Revises: 9c44c65e8b28
Create Date: 2025-10-05 21:52:54.271956

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9252953127af'
down_revision: Union[str, None] = '9c44c65e8b28'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Remove odometer_reading column from Fuel_Info table
    op.drop_column('Fuel_Info', 'odometer_reading')


def downgrade() -> None:
    """Downgrade schema."""
    # Add odometer_reading column back if rolling back
    op.add_column('Fuel_Info', sa.Column('odometer_reading', sa.Integer(), nullable=True))
