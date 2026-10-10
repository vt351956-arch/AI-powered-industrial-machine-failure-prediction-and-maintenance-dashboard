import uuid
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    machine_id = Column(String(36), ForeignKey("machines.id", ondelete="CASCADE"), nullable=False, index=True)
    prediction_time = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    failure_probability = Column(Float, nullable=False)   # 0.00 to 1.00
    health_score = Column(Float, nullable=False)          # 0 to 100
    risk_level = Column(String(20), nullable=False, index=True)  # LOW, MEDIUM, HIGH
    predicted_failure = Column(Boolean, nullable=False)
    model_version = Column(String(50), nullable=False)

    machine = relationship("Machine", back_populates="predictions")

    __table_args__ = (
        Index("idx_prediction_machine_time", "machine_id", "prediction_time"),
    )
