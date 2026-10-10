import uuid
from sqlalchemy import Column, String, Float, Text, Date, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    machine_id = Column(String(36), ForeignKey("machines.id", ondelete="CASCADE"), nullable=False, index=True)
    maintenance_date = Column(Date, nullable=False, index=True)
    maintenance_type = Column(String(50), nullable=False, index=True)  # PREVENTIVE, CORRECTIVE, INSPECTION, OVERHAUL
    description = Column(Text, nullable=False)
    technician = Column(String(100), nullable=False)
    cost = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    machine = relationship("Machine", back_populates="maintenance_records")

    __table_args__ = (
        Index("idx_maint_machine_date", "machine_id", "maintenance_date"),
    )
