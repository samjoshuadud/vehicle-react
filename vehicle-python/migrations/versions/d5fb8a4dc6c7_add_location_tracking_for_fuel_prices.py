"""add_location_tracking_for_fuel_prices

Revision ID: d5fb8a4dc6c7
Revises: ed3254ecdbf0
Create Date: 2025-10-05 22:21:31.972374

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd5fb8a4dc6c7'
down_revision: Union[str, None] = 'ed3254ecdbf0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
