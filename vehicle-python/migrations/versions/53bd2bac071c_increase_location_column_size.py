"""increase_location_column_size

Revision ID: 53bd2bac071c
Revises: d5fb8a4dc6c7
Create Date: 2025-10-05 22:47:11.917147

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '53bd2bac071c'
down_revision: Union[str, None] = 'd5fb8a4dc6c7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Increase location column size from VARCHAR(100) to VARCHAR(500)
    # to accommodate full addresses from geocoding services
    op.alter_column('Fuel_Info', 'location',
                    existing_type=sa.String(100),
                    type_=sa.String(500),
                    existing_nullable=True)


def downgrade() -> None:
    """Downgrade schema."""
    # Revert location column back to VARCHAR(100)
    op.alter_column('Fuel_Info', 'location',
                    existing_type=sa.String(500),
                    type_=sa.String(100),
                    existing_nullable=True)
