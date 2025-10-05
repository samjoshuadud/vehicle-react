"""add_location_tracking_for_fuel_prices

Revision ID: ed3254ecdbf0
Revises: 8de415505413
Create Date: 2025-10-05 22:21:17.434417

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ed3254ecdbf0'
down_revision: Union[str, None] = '8de415505413'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add location tracking columns to Fuel_Info table
    op.add_column('Fuel_Info', sa.Column('latitude', sa.DECIMAL(10, 8), nullable=True))
    op.add_column('Fuel_Info', sa.Column('longitude', sa.DECIMAL(11, 8), nullable=True))
    op.add_column('Fuel_Info', sa.Column('normalized_location', sa.String(255), nullable=True))
    op.add_column('Fuel_Info', sa.Column('station_cluster_id', sa.String(100), nullable=True))
    
    # Create Gas_Station_Clusters table for tracking unique stations
    op.create_table(
        'Gas_Station_Clusters',
        sa.Column('cluster_id', sa.String(100), primary_key=True),
        sa.Column('normalized_name', sa.String(255), nullable=False),
        sa.Column('latitude', sa.DECIMAL(10, 8), nullable=False),
        sa.Column('longitude', sa.DECIMAL(11, 8), nullable=False),
        sa.Column('brand', sa.String(100), nullable=True),
        sa.Column('street', sa.String(255), nullable=True),
        sa.Column('city', sa.String(100), nullable=True),
        sa.Column('report_count', sa.Integer, default=0),
        sa.Column('created_at', sa.DateTime, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime, server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')),
    )
    
    # Create index for faster location-based queries
    op.create_index('idx_fuel_location', 'Fuel_Info', ['latitude', 'longitude'])
    op.create_index('idx_fuel_cluster', 'Fuel_Info', ['station_cluster_id'])
    op.create_index('idx_cluster_location', 'Gas_Station_Clusters', ['latitude', 'longitude'])


def downgrade() -> None:
    """Downgrade schema."""
    # Drop indexes
    op.drop_index('idx_cluster_location', 'Gas_Station_Clusters')
    op.drop_index('idx_fuel_cluster', 'Fuel_Info')
    op.drop_index('idx_fuel_location', 'Fuel_Info')
    
    # Drop Gas_Station_Clusters table
    op.drop_table('Gas_Station_Clusters')
    
    # Remove columns from Fuel_Info
    op.drop_column('Fuel_Info', 'station_cluster_id')
    op.drop_column('Fuel_Info', 'normalized_location')
    op.drop_column('Fuel_Info', 'longitude')
    op.drop_column('Fuel_Info', 'latitude')
