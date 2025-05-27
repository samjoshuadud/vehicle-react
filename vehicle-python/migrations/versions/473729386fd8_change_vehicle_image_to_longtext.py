"""Change vehicle_image to LONGTEXT

Revision ID: 473729386fd8
Revises: ecf0149a2b64
Create Date: 2025-05-27 23:18:21.012334

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '473729386fd8'
down_revision: Union[str, None] = 'ecf0149a2b64'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Change vehicle_image column from TEXT to LONGTEXT to support larger base64 images
    op.execute("ALTER TABLE Vehicles_Info MODIFY COLUMN vehicle_image LONGTEXT")


def downgrade() -> None:
    """Downgrade schema."""
    # Change vehicle_image column back to TEXT
    op.execute("ALTER TABLE Vehicles_Info MODIFY COLUMN vehicle_image TEXT")
