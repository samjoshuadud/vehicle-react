"""initial_migration_current_state

Revision ID: 9c44c65e8b28
Revises: 
Create Date: 2025-10-05 00:00:21.971903

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = '9c44c65e8b28'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Database already matches the current model state
    pass


def downgrade() -> None:
    """Downgrade schema."""
    # Database already matches the current model state
    pass
