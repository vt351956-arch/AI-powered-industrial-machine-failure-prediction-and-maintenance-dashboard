from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc
from sqlalchemy.orm import Session
import numpy as np

from app.database import get_db
from app.models.machine import Machine
from app.models.sensor import SensorReading
from app.models.user import User
from app.schemas.sensor import (
    SensorReadingCreate,
    SensorReadingResponse,
    SyntheticSensorBatchRequest,
)
from app.services.ml_service import ml_service
from app.utils.dependencies import get_current_user, require_role

router = APIRouter(prefix="/sensors", tags=["Sensors"])


@router.post("", response_model=SensorReadingResponse, status_code=status.HTTP_201_CREATED)
def add_sensor_reading(
    payload: SensorReadingCreate,
    current_user: User = Depends(require_role(["admin", "engineer"])),
    db: Session = Depends(get_db),
):
    """
    Ingest a new sensor telemetry reading.
    Automatically runs Isolation Forest anomaly detection on the reading.
    """
    machine = db.query(Machine).filter(Machine.id == payload.machine_id).first()
    if not machine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Machine with ID '{payload.machine_id}' does not exist.",
        )

    # Anomaly detection via ML service
    prediction = ml_service.predict(
        temperature=payload.temperature,
        vibration=payload.vibration,
        pressure=payload.pressure,
        rpm=payload.rpm,
        power_consumption=payload.power_consumption,
        operating_hours=payload.operating_hours,
    )

    reading = SensorReading(
        machine_id=payload.machine_id,
        timestamp=payload.timestamp or datetime.now(timezone.utc),
        temperature=payload.temperature,
        vibration=payload.vibration,
        pressure=payload.pressure,
        rpm=payload.rpm,
        power_consumption=payload.power_consumption,
        operating_hours=payload.operating_hours,
        is_anomaly=prediction.get("anomaly_detected", False),
        anomaly_score=prediction.get("anomaly_score", 0.0),
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)

    return reading


@router.get("", response_model=List[SensorReadingResponse])
def get_sensor_readings(
    machine_id: Optional[str] = Query(None, description="Filter by machine ID"),
    start_date: Optional[datetime] = Query(None, description="Start timestamp ISO-8601"),
    end_date: Optional[datetime] = Query(None, description="End timestamp ISO-8601"),
    is_anomaly: Optional[bool] = Query(None, description="Filter anomalous readings"),
    limit: int = Query(100, ge=1, le=1000),
    skip: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve sensor telemetry records with optional machine and date range filters.
    """
    query = db.query(SensorReading)

    if machine_id:
        query = query.filter(SensorReading.machine_id == machine_id)
    if start_date:
        query = query.filter(SensorReading.timestamp >= start_date)
    if end_date:
        query = query.filter(SensorReading.timestamp <= end_date)
    if is_anomaly is not None:
        query = query.filter(SensorReading.is_anomaly == is_anomaly)

    readings = (
        query.order_by(desc(SensorReading.timestamp))
        .offset(skip)
        .limit(limit)
        .all()
    )
    return readings


@router.get("/latest", response_model=List[SensorReadingResponse])
def get_latest_readings(
    machine_id: Optional[str] = Query(None, description="Specific machine ID or all if omitted"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Fetch the most recent telemetry record for a machine or across all machines.
    """
    if machine_id:
        latest = (
            db.query(SensorReading)
            .filter(SensorReading.machine_id == machine_id)
            .order_by(desc(SensorReading.timestamp))
            .first()
        )
        return [latest] if latest else []

    # Get latest reading per machine
    machines = db.query(Machine.id).all()
    results = []
    for (m_id,) in machines:
        item = (
            db.query(SensorReading)
            .filter(SensorReading.machine_id == m_id)
            .order_by(desc(SensorReading.timestamp))
            .first()
        )
        if item:
            results.append(item)
    return results


@router.post("/synthetic-batch", response_model=List[SensorReadingResponse], status_code=status.HTTP_201_CREATED)
def generate_synthetic_batch(
    payload: SyntheticSensorBatchRequest,
    current_user: User = Depends(require_role(["admin", "engineer"])),
    db: Session = Depends(get_db),
):
    """
    Generate synthetic telemetry samples for real-time demonstration.
    Clearly marks synthetic data for demo purposes.
    """
    machine = db.query(Machine).filter(Machine.id == payload.machine_id).first()
    if not machine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Machine with ID '{payload.machine_id}' does not exist.",
        )

    # Base operating values
    last_reading = (
        db.query(SensorReading)
        .filter(SensorReading.machine_id == payload.machine_id)
        .order_by(desc(SensorReading.timestamp))
        .first()
    )
    base_hours = last_reading.operating_hours if last_reading else 2500.0

    created_records = []
    now = datetime.now(timezone.utc)

    for i in range(payload.count):
        hours = base_hours + (i * 0.5)
        # Apply simulated stress modes
        if payload.stress_mode == "THERMAL":
            temp = float(np.random.normal(92.0, 4.0))
            vib = float(np.random.normal(3.8, 0.5))
            press = float(np.random.normal(4.1, 0.3))
            rpm = float(np.random.normal(1750.0, 30.0))
            power = float(np.random.normal(26.0, 2.5))
        elif payload.stress_mode == "BEARING":
            temp = float(np.random.normal(82.0, 5.0))
            vib = float(np.random.normal(7.2, 1.2))
            press = float(np.random.normal(4.0, 0.4))
            rpm = float(np.random.normal(1720.0, 45.0))
            power = float(np.random.normal(22.0, 2.0))
        elif payload.stress_mode == "HYDRAULIC":
            temp = float(np.random.normal(70.0, 3.5))
            vib = float(np.random.normal(4.5, 0.8))
            press = float(np.random.normal(1.9, 0.4))
            rpm = float(np.random.normal(1770.0, 25.0))
            power = float(np.random.normal(18.0, 2.0))
        else:  # NORMAL
            temp = float(np.random.normal(65.0, 3.0))
            vib = float(np.random.normal(2.1, 0.3))
            press = float(np.random.normal(4.2, 0.3))
            rpm = float(np.random.normal(1785.0, 20.0))
            power = float(np.random.normal(14.5, 1.2))

        pred = ml_service.predict(
            temperature=temp,
            vibration=vib,
            pressure=press,
            rpm=rpm,
            power_consumption=power,
            operating_hours=hours,
        )

        reading = SensorReading(
            machine_id=payload.machine_id,
            timestamp=now,
            temperature=round(temp, 2),
            vibration=round(vib, 2),
            pressure=round(press, 2),
            rpm=round(rpm, 1),
            power_consumption=round(power, 2),
            operating_hours=round(hours, 1),
            is_anomaly=pred.get("anomaly_detected", False),
            anomaly_score=pred.get("anomaly_score", 0.0),
        )
        db.add(reading)
        created_records.append(reading)

    db.commit()
    for r in created_records:
        db.refresh(r)

    return created_records
