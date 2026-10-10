import uuid
from sqlalchemy import Column, String, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Machine(Base):
    __tablename__ = "machines"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    machine_code = Column(String(50), unique=True, index=True, nullable=False)
    machine_name = Column(String(100), nullable=False)
    machine_type = Column(String(50), nullable=False, index=True)
    location = Column(String(100), nullable=False)
    installation_date = Column(Date, nullable=False)
    status = Column(String(20), nullable=False, default="HEALTHY", index=True)  # HEALTHY, WARNING, CRITICAL, OFFLINE
    created_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    creator = relationship("User", back_populates="machines")
    sensor_readings = relationship("SensorReading", back_populates="machine", cascade="all, delete-orphan", order_by="desc(SensorReading.timestamp)")
    predictions = relationship("Prediction", back_populates="machine", cascade="all, delete-orphan", order_by="desc(Prediction.prediction_time)")
    maintenance_records = relationship("MaintenanceRecord", back_populates="machine", cascade="all, delete-orphan", order_by="desc(MaintenanceRecord.maintenance_date)")
