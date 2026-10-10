import uuid
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    machine_id = Column(String(36), ForeignKey("machines.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    temperature = Column(Float, nullable=False)        # °C
    vibration = Column(Float, nullable=False)          # mm/s RMS
    pressure = Column(Float, nullable=False)           # bar
    rpm = Column(Float, nullable=False)                # RPM
    power_consumption = Column(Float, nullable=False)  # kW
    operating_hours = Column(Float, nullable=False)    # Cumulative hours
    is_anomaly = Column(Boolean, default=False, nullable=False, index=True)
    anomaly_score = Column(Float, default=0.0, nullable=False)

    machine = relationship("Machine", back_populates="sensor_readings")

    __table_args__ = (
        Index("idx_sensor_machine_timestamp", "machine_id", "timestamp"),
    )
