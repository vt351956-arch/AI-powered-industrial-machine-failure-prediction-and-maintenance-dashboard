from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, desc
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.machine import Machine
from app.models.prediction import Prediction
from app.models.sensor import SensorReading
from app.models.maintenance import MaintenanceRecord
from app.models.user import User
from app.schemas.dashboard import (
    DashboardData,
    DashboardSummary,
    FailureRiskDistribution,
    HealthTrendPoint,
    MachineHealthBar,
    MaintenanceCostPoint,
    ScatterPoint,
    SensorTrendPoint,
)
from app.services.ml_service import ml_service
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Computes top-level Industrial KPI summary cards from active equipment in PostgreSQL.
    """
    total_machines = db.query(Machine).count()
    healthy_machines = db.query(Machine).filter(Machine.status == "HEALTHY").count()
    warning_machines = db.query(Machine).filter(Machine.status == "WARNING").count()
    critical_machines = db.query(Machine).filter(Machine.status == "CRITICAL").count()
    offline_machines = db.query(Machine).filter(Machine.status == "OFFLINE").count()

    # Predictions summary
    high_risk_count = db.query(Prediction).filter(Prediction.risk_level == "HIGH").count()

    # Calculate average health score from the latest prediction of each machine
    latest_health_scores = []
    machines = db.query(Machine.id).all()
    for (m_id,) in machines:
        pred = (
            db.query(Prediction.health_score)
            .filter(Prediction.machine_id == m_id)
            .order_by(desc(Prediction.prediction_time))
            .first()
        )
        if pred:
            latest_health_scores.append(pred[0])

    avg_health = (
        round(sum(latest_health_scores) / len(latest_health_scores), 1)
        if latest_health_scores
        else 85.0
    )

    anomalies_count = db.query(SensorReading).filter(SensorReading.is_anomaly == True).count()

    return DashboardSummary(
        total_machines=total_machines,
        healthy_machines=healthy_machines,
        warning_machines=warning_machines,
        critical_machines=critical_machines,
        offline_machines=offline_machines,
        high_risk_predictions=high_risk_count,
        average_health_score=avg_health,
        total_anomalies_detected=anomalies_count,
    )


@router.get("/health-trend", response_model=List[HealthTrendPoint])
def get_health_trend(
    days: int = Query(7, ge=1, le=90),
    machine_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Aggregates machine health scores and risk status over chronological intervals.
    """
    since_date = datetime.now(timezone.utc) - timedelta(days=days)
    query = db.query(Prediction).filter(Prediction.prediction_time >= since_date)

    if machine_id:
        query = query.filter(Prediction.machine_id == machine_id)

    predictions = query.order_by(Prediction.prediction_time.asc()).all()

    # Group by date / time interval
    grouped = defaultdict(list)
    for p in predictions:
        date_key = p.prediction_time.strftime("%b %d %H:00" if days <= 3 else "%b %d")
        grouped[date_key].append(p)

    points = []
    for date_key, preds in grouped.items():
        avg_h = sum(p.health_score for p in preds) / len(preds)
        h_cnt = sum(1 for p in preds if p.risk_level == "LOW")
        w_cnt = sum(1 for p in preds if p.risk_level == "MEDIUM")
        c_cnt = sum(1 for p in preds if p.risk_level == "HIGH")
        points.append(
            HealthTrendPoint(
                timestamp=date_key,
                average_health=round(avg_h, 1),
                healthy_count=h_cnt,
                warning_count=w_cnt,
                critical_count=c_cnt,
            )
        )

    # If empty, return a reasonable baseline so charts don't crash
    if not points:
        now = datetime.now(timezone.utc)
        for i in range(days, 0, -1):
            dt = now - timedelta(days=i)
            points.append(
                HealthTrendPoint(
                    timestamp=dt.strftime("%b %d"),
                    average_health=88.0,
                    healthy_count=total_machines if (total_machines := db.query(Machine).count()) else 5,
                    warning_count=0,
                    critical_count=0,
                )
            )

    return points


@router.get("/failure-risk", response_model=FailureRiskDistribution)
def get_failure_risk_distribution(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Calculates distribution of current failure risk across fleet.
    """
    machines = db.query(Machine.id).all()
    low_cnt, med_cnt, high_cnt = 0, 0, 0

    for (m_id,) in machines:
        pred = (
            db.query(Prediction.risk_level)
            .filter(Prediction.machine_id == m_id)
            .order_by(desc(Prediction.prediction_time))
            .first()
        )
        if pred:
            if pred[0] == "HIGH":
                high_cnt += 1
            elif pred[0] == "MEDIUM":
                med_cnt += 1
            else:
                low_cnt += 1
        else:
            low_cnt += 1

    return FailureRiskDistribution(
        low_risk=low_cnt,
        medium_risk=med_cnt,
        high_risk=high_cnt,
    )


@router.get("/sensor-trends", response_model=List[SensorTrendPoint])
def get_sensor_trends(
    machine_id: Optional[str] = Query(None),
    limit: int = Query(60, ge=10, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Chronological multi-sensor telemetry trend (Temperature, Vibration, Pressure, RPM, Power).
    """
    query = db.query(SensorReading, Machine.machine_code).join(
        Machine, SensorReading.machine_id == Machine.id
    )

    if machine_id:
        query = query.filter(SensorReading.machine_id == machine_id)

    records = (
        query.order_by(desc(SensorReading.timestamp))
        .limit(limit)
        .all()
    )

    # Reverse to chronological order (oldest to newest)
    records.reverse()

    results = []
    for r, code in records:
        results.append(
            SensorTrendPoint(
                timestamp=r.timestamp.strftime("%H:%M:%S"),
                machine_code=code,
                temperature=r.temperature,
                vibration=r.vibration,
                pressure=r.pressure,
                rpm=r.rpm,
                power_consumption=r.power_consumption,
                is_anomaly=r.is_anomaly,
            )
        )
    return results


@router.get("/scatter", response_model=List[ScatterPoint])
def get_scatter_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Temperature vs Vibration cross-correlation scatter points with health score and risk level.
    """
    machines = db.query(Machine).all()
    scatter = []

    for m in machines:
        sensor = (
            db.query(SensorReading)
            .filter(SensorReading.machine_id == m.id)
            .order_by(desc(SensorReading.timestamp))
            .first()
        )
        pred = (
            db.query(Prediction)
            .filter(Prediction.machine_id == m.id)
            .order_by(desc(Prediction.prediction_time))
            .first()
        )

        if sensor:
            scatter.append(
                ScatterPoint(
                    machine_code=m.machine_code,
                    machine_name=m.machine_name,
                    temperature=sensor.temperature,
                    vibration=sensor.vibration,
                    health_score=pred.health_score if pred else 85.0,
                    risk_level=pred.risk_level if pred else "LOW",
                )
            )
    return scatter


@router.get("/machine-comparison", response_model=List[MachineHealthBar])
def get_machine_health_comparison(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Comparative health scores across all equipment in the plant.
    """
    machines = db.query(Machine).order_by(Machine.machine_code.asc()).all()
    comparison = []

    for m in machines:
        pred = (
            db.query(Prediction)
            .filter(Prediction.machine_id == m.id)
            .order_by(desc(Prediction.prediction_time))
            .first()
        )
        comparison.append(
            MachineHealthBar(
                machine_id=m.id,
                machine_code=m.machine_code,
                machine_name=m.machine_name,
                health_score=pred.health_score if pred else (30.0 if m.status == "CRITICAL" else 85.0),
                risk_level=pred.risk_level if pred else ("HIGH" if m.status == "CRITICAL" else "LOW"),
                status=m.status,
            )
        )
    return comparison


@router.get("/maintenance-cost", response_model=List[MaintenanceCostPoint])
def get_maintenance_cost_trend(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Monthly maintenance expenditure trend broken down by Preventive and Corrective work orders.
    """
    records = db.query(MaintenanceRecord).all()
    monthly_data = defaultdict(lambda: {"preventive": 0.0, "corrective": 0.0, "total": 0.0})

    for r in records:
        month_str = r.maintenance_date.strftime("%b %Y")
        monthly_data[month_str]["total"] += r.cost
        if r.maintenance_type in ["PREVENTIVE", "INSPECTION"]:
            monthly_data[month_str]["preventive"] += r.cost
        else:
            monthly_data[month_str]["corrective"] += r.cost

    if not monthly_data:
        # Provide default month points
        now = datetime.now()
        for i in range(5, -1, -1):
            m_date = now - timedelta(days=i * 30)
            m_str = m_date.strftime("%b %Y")
            monthly_data[m_str] = {"preventive": 1200.0 + (i * 150), "corrective": 800.0 + (i * 200), "total": 2000.0 + (i * 350)}

    points = [
        MaintenanceCostPoint(
            month=m,
            preventive_cost=round(vals["preventive"], 2),
            corrective_cost=round(vals["corrective"], 2),
            total_cost=round(vals["total"], 2),
        )
        for m, vals in monthly_data.items()
    ]
    return points


@router.get("/all", response_model=DashboardData)
def get_all_dashboard_analytics(
    days: int = Query(7, ge=1, le=90),
    machine_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Consolidated dashboard payload for single-roundtrip fast frontend initialization.
    """
    summary = get_dashboard_summary(current_user=current_user, db=db)
    health_trend = get_health_trend(days=days, machine_id=machine_id, current_user=current_user, db=db)
    risk_distribution = get_failure_risk_distribution(current_user=current_user, db=db)
    sensor_trends = get_sensor_trends(machine_id=machine_id, limit=40, current_user=current_user, db=db)
    scatter = get_scatter_data(current_user=current_user, db=db)
    comparison = get_machine_health_comparison(current_user=current_user, db=db)
    maint_costs = get_maintenance_cost_trend(current_user=current_user, db=db)

    return DashboardData(
        summary=summary,
        health_trend=health_trend,
        risk_distribution=risk_distribution,
        sensor_trends=sensor_trends,
        scatter_points=scatter,
        machine_health_comparison=comparison,
        maintenance_cost_trend=maint_costs,
        model_version=ml_service.model_version,
        is_demo_data=True,
    )
