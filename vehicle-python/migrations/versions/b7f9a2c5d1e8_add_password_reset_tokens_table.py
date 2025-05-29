"""add_password_reset_tokens_table

Revision ID: b7f9a2c5d1e8
Revises: 417103a36aee
Create Date: 2025-05-29 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7f9a2c5d1e8'
down_revision: Union[str, None] = '417103a36aee'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create Password_Reset_Tokens table."""
    op.create_table(
        'Password_Reset_Tokens',
        sa.Column('token_id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('Users.user_id', ondelete='CASCADE'), nullable=False),
        sa.Column('token', sa.String(6), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('used', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(), default=sa.func.now()),
        sa.PrimaryKeyConstraint('token_id')
    )


def downgrade() -> None:
    """Drop Password_Reset_Tokens table."""
    op.drop_table('Password_Reset_Tokens')
