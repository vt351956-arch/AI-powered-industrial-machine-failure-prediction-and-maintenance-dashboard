from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.machine import Machine
from app.models.maintenance import MaintenanceRecord
from app.models.user import User
from app.schemas.maintenance import (
    MaintenanceCreate,
    MaintenanceResponse,
    MaintenanceUpdate,
)
from app.utils.dependencies import get_current_user, require_role

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])


def enrich_maintenance_record(rec: MaintenanceRecord, db: Session) -> MaintenanceResponse:
    machine = db.query(Machine).filter(Machine.id == rec.machine_id).first()
    res = MaintenanceResponse.model_validate(rec)
    if machine:
        res.machine_name = machine.machine_name
        res.machine_code = machine.machine_code
    return res


@router.get("", response_model=List[MaintenanceResponse])
def list_maintenance_records(
    machine_id: Optional[str] = Query(None, description="Filter by machine ID"),
    maintenance_type: Optional[str] = Query(None, description="Filter by type (PREVENTIVE, CORRECTIVE, etc.)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List all maintenance work orders and logs.
    """
    query = db.query(MaintenanceRecord)

    if machine_id:
        query = query.filter(MaintenanceRecord.machine_id == machine_id)
    if maintenance_type:
        query = query.filter(MaintenanceRecord.maintenance_type == maintenance_type.upper().strip())

    records = (
        query.order_by(desc(MaintenanceRecord.maintenance_date))
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [enrich_maintenance_record(r, db) for r in records]


@router.post("", response_model=MaintenanceResponse, status_code=status.HTTP_201_CREATED)
def create_maintenance_record(
    payload: MaintenanceCreate,
    current_user: User = Depends(require_role(["admin", "engineer"])),
    db: Session = Depends(get_db),
):
    """
    Log a new maintenance event or work order.
    """
    machine = db.query(Machine).filter(Machine.id == payload.machine_id).first()
    if not machine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Machine with ID '{payload.machine_id}' was not found.",
        )

    record = MaintenanceRecord(
        machine_id=payload.machine_id,
        maintenance_date=payload.maintenance_date,
        maintenance_type=payload.maintenance_type.upper().strip(),
        description=payload.description.strip(),
        technician=payload.technician.strip(),
        cost=payload.cost,
    )
    db.add(record)

    # If maintenance is overhaul or corrective, reset machine status to HEALTHY
    if record.maintenance_type in ["CORRECTIVE", "OVERHAUL"] and machine.status in ["WARNING", "CRITICAL"]:
        machine.status = "HEALTHY"

    db.commit()
    db.refresh(record)

    return enrich_maintenance_record(record, db)


@router.get("/{record_id}", response_model=MaintenanceResponse)
def get_maintenance_record(
    record_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Fetch a single maintenance record by ID.
    """
    rec = db.query(MaintenanceRecord).filter(MaintenanceRecord.id == record_id).first()
    if not rec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Maintenance record with ID '{record_id}' not found.",
        )
    return enrich_maintenance_record(rec, db)


@router.put("/{record_id}", response_model=MaintenanceResponse)
def update_maintenance_record(
    record_id: str,
    payload: MaintenanceUpdate,
    current_user: User = Depends(require_role(["admin", "engineer"])),
    db: Session = Depends(get_db),
):
    """
    Modify an existing maintenance record.
    """
    rec = db.query(MaintenanceRecord).filter(MaintenanceRecord.id == record_id).first()
    if not rec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Maintenance record with ID '{record_id}' not found.",
        )

    if payload.maintenance_date is not None:
        rec.maintenance_date = payload.maintenance_date
    if payload.maintenance_type is not None:
        rec.maintenance_type = payload.maintenance_type.upper().strip()
    if payload.description is not None:
        rec.description = payload.description.strip()
    if payload.technician is not None:
        rec.technician = payload.technician.strip()
    if payload.cost is not None:
        rec.cost = payload.cost

    db.commit()
    db.refresh(rec)
    return enrich_maintenance_record(rec, db)


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_maintenance_record(
    record_id: str,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    """
    Delete a maintenance record. Admin only.
    """
    rec = db.query(MaintenanceRecord).filter(MaintenanceRecord.id == record_id).first()
    if not rec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Maintenance record with ID '{record_id}' not found.",
        )
    db.delete(rec)
    db.commit()
    return None
