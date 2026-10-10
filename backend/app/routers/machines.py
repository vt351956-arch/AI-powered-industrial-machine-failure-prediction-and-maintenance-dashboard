from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, desc
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.machine import Machine
from app.models.prediction import Prediction
from app.models.sensor import SensorReading
from app.models.maintenance import MaintenanceRecord
from app.models.user import User
from app.schemas.machine import (
    MachineCreate,
    MachineDetailResponse,
    MachineResponse,
    MachineUpdate,
)
from app.utils.dependencies import get_current_user, require_role

router = APIRouter(prefix="/machines", tags=["Machines"])


def enrich_machine_response(machine: Machine, db: Session) -> MachineResponse:
    """Helper to populate latest prediction metrics onto machine response."""
    latest_pred = (
        db.query(Prediction)
        .filter(Prediction.machine_id == machine.id)
        .order_by(desc(Prediction.prediction_time))
        .first()
    )
    res = MachineResponse.model_validate(machine)
    if latest_pred:
        res.latest_health_score = latest_pred.health_score
        res.latest_risk_level = latest_pred.risk_level
        res.latest_failure_probability = latest_pred.failure_probability
    return res


@router.get("", response_model=List[MachineResponse])
def list_machines(
    search: Optional[str] = Query(None, description="Search machine name or code"),
    status: Optional[str] = Query(None, description="Filter by status (HEALTHY, WARNING, CRITICAL, OFFLINE)"),
    machine_type: Optional[str] = Query(None, description="Filter by machine type"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List all registered industrial machines with optional search and filters.
    """
    query = db.query(Machine)

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Machine.machine_code.ilike(search_fmt),
                Machine.machine_name.ilike(search_fmt),
                Machine.location.ilike(search_fmt),
            )
        )

    if status:
        query = query.filter(Machine.status == status.upper().strip())

    if machine_type:
        query = query.filter(Machine.machine_type.ilike(f"%{machine_type.strip()}%"))

    machines = query.order_by(Machine.machine_code.asc()).offset(skip).limit(limit).all()

    return [enrich_machine_response(m, db) for m in machines]


@router.post("", response_model=MachineResponse, status_code=status.HTTP_201_CREATED)
def create_machine(
    payload: MachineCreate,
    current_user: User = Depends(require_role(["admin", "engineer"])),
    db: Session = Depends(get_db),
):
    """
    Register a new industrial machine asset. Requires admin or engineer role.
    """
    code = payload.machine_code.strip().upper()
    existing = db.query(Machine).filter(Machine.machine_code == code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Machine with code '{code}' already exists.",
        )

    status_val = payload.status.upper().strip()
    if status_val not in ["HEALTHY", "WARNING", "CRITICAL", "OFFLINE"]:
        status_val = "HEALTHY"

    machine = Machine(
        machine_code=code,
        machine_name=payload.machine_name.strip(),
        machine_type=payload.machine_type.strip(),
        location=payload.location.strip(),
        installation_date=payload.installation_date,
        status=status_val,
        created_by=current_user.id,
    )
    db.add(machine)
    db.commit()
    db.refresh(machine)

    return enrich_machine_response(machine, db)


@router.get("/{machine_id}", response_model=MachineDetailResponse)
def get_machine_detail(
    machine_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get detailed machine telemetry, counts, and latest health indicators.
    """
    machine = db.query(Machine).filter(Machine.id == machine_id).first()
    if not machine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Machine with ID '{machine_id}' was not found.",
        )

    latest_pred = (
        db.query(Prediction)
        .filter(Prediction.machine_id == machine.id)
        .order_by(desc(Prediction.prediction_time))
        .first()
    )

    latest_sensor = (
        db.query(SensorReading)
        .filter(SensorReading.machine_id == machine.id)
        .order_by(desc(SensorReading.timestamp))
        .first()
    )

    total_hours = latest_sensor.operating_hours if latest_sensor else 0.0
    maint_count = db.query(MaintenanceRecord).filter(MaintenanceRecord.machine_id == machine.id).count()
    pred_count = db.query(Prediction).filter(Prediction.machine_id == machine.id).count()

    detail = MachineDetailResponse(
        id=machine.id,
        machine_code=machine.machine_code,
        machine_name=machine.machine_name,
        machine_type=machine.machine_type,
        location=machine.location,
        installation_date=machine.installation_date,
        status=machine.status,
        created_by=machine.created_by,
        created_at=machine.created_at,
        latest_health_score=latest_pred.health_score if latest_pred else 100.0,
        latest_risk_level=latest_pred.risk_level if latest_pred else "LOW",
        latest_failure_probability=latest_pred.failure_probability if latest_pred else 0.0,
        latest_sensor_reading={
            "temperature": latest_sensor.temperature,
            "vibration": latest_sensor.vibration,
            "pressure": latest_sensor.pressure,
            "rpm": latest_sensor.rpm,
            "power_consumption": latest_sensor.power_consumption,
            "operating_hours": latest_sensor.operating_hours,
            "timestamp": latest_sensor.timestamp.isoformat(),
            "is_anomaly": latest_sensor.is_anomaly,
        } if latest_sensor else None,
        total_operating_hours=total_hours,
        total_maintenance_records=maint_count,
        total_predictions=pred_count,
    )
    return detail


@router.put("/{machine_id}", response_model=MachineResponse)
def update_machine(
    machine_id: str,
    payload: MachineUpdate,
    current_user: User = Depends(require_role(["admin", "engineer"])),
    db: Session = Depends(get_db),
):
    """
    Update industrial machine attributes or operational status.
    """
    machine = db.query(Machine).filter(Machine.id == machine_id).first()
    if not machine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Machine with ID '{machine_id}' was not found.",
        )

    if payload.machine_name is not None:
        machine.machine_name = payload.machine_name.strip()
    if payload.machine_type is not None:
        machine.machine_type = payload.machine_type.strip()
    if payload.location is not None:
        machine.location = payload.location.strip()
    if payload.installation_date is not None:
        machine.installation_date = payload.installation_date
    if payload.status is not None:
        status_val = payload.status.upper().strip()
        if status_val in ["HEALTHY", "WARNING", "CRITICAL", "OFFLINE"]:
            machine.status = status_val

    db.commit()
    db.refresh(machine)
    return enrich_machine_response(machine, db)


@router.delete("/{machine_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_machine(
    machine_id: str,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    """
    Decommission and delete machine asset. Admin only.
    """
    machine = db.query(Machine).filter(Machine.id == machine_id).first()
    if not machine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Machine with ID '{machine_id}' was not found.",
        )

    db.delete(machine)
    db.commit()
    return None
