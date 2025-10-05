"""add_location_tracking_for_fuel_prices

Revision ID: 8de415505413
Revises: 9252953127af
Create Date: 2025-10-05 22:20:33.114263

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8de415505413'
down_revision: Union[str, None] = '9252953127af'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
