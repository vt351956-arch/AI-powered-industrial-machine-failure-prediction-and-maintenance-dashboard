from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.machine import Machine
from app.models.prediction import Prediction
from app.models.sensor import SensorReading
from app.models.user import User
from app.schemas.alert import AlertItem
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("", response_model=List[AlertItem])
def get_system_alerts(
    risk_level: Optional[str] = Query(None, description="Filter by risk level (HIGH, MEDIUM, LOW)"),
    machine_id: Optional[str] = Query(None, description="Filter by machine ID"),
    severity: Optional[str] = Query(None, description="Filter by severity (CRITICAL, WARNING, INFO)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Synthesizes active operational alerts from high-risk predictions,
    Isolation Forest sensor anomalies, and critical machine statuses.
    """
    alerts: List[AlertItem] = []

    # 1. Critical and Warning Machine Statuses
    mach_query = db.query(Machine).filter(Machine.status.in_(["CRITICAL", "WARNING"]))
    if machine_id:
        mach_query = mach_query.filter(Machine.id == machine_id)
    critical_machines = mach_query.all()

    for m in critical_machines:
        sev = "CRITICAL" if m.status == "CRITICAL" else "WARNING"
        alerts.append(
            AlertItem(
                id=f"mach-status-{m.id}",
                machine_id=m.id,
                machine_code=m.machine_code,
                machine_name=m.machine_name,
                alert_type="CRITICAL_STATUS",
                severity=sev,
                title=f"Machine Status: {m.status}",
                message=f"Equipment '{m.machine_name}' is currently flagged as {m.status}. Immediate inspection advised.",
                metric_value=None,
                metric_unit=None,
                timestamp=m.created_at,
            )
        )

    # 2. High & Medium Risk Predictions
    pred_query = db.query(Prediction, Machine).join(Machine, Prediction.machine_id == Machine.id)
    if machine_id:
        pred_query = pred_query.filter(Prediction.machine_id == machine_id)
    if risk_level:
        pred_query = pred_query.filter(Prediction.risk_level == risk_level.upper().strip())
    else:
        pred_query = pred_query.filter(Prediction.risk_level.in_(["HIGH", "MEDIUM"]))

    recent_preds = pred_query.order_by(desc(Prediction.prediction_time)).limit(30).all()

    for p, m in recent_preds:
        sev = "CRITICAL" if p.risk_level == "HIGH" else "WARNING"
        alerts.append(
            AlertItem(
                id=f"pred-risk-{p.id}",
                machine_id=m.id,
                machine_code=m.machine_code,
                machine_name=m.machine_name,
                alert_type="HIGH_RISK" if p.risk_level == "HIGH" else "MEDIUM_RISK",
                severity=sev,
                title=f"{p.risk_level} Failure Probability ({round(p.failure_probability * 100, 1)}%)",
                message=f"Model {p.model_version} estimated health score of {p.health_score}/100. Failure risk is elevated.",
                metric_value=p.failure_probability,
                metric_unit="prob",
                timestamp=p.prediction_time,
            )
        )

    # 3. Isolation Forest Unsupervised Sensor Anomalies
    sensor_query = (
        db.query(SensorReading, Machine)
        .join(Machine, SensorReading.machine_id == Machine.id)
        .filter(SensorReading.is_anomaly == True)
    )
    if machine_id:
        sensor_query = sensor_query.filter(SensorReading.machine_id == machine_id)

    recent_anomalies = sensor_query.order_by(desc(SensorReading.timestamp)).limit(30).all()

    for s, m in recent_anomalies:
        alerts.append(
            AlertItem(
                id=f"sensor-anomaly-{s.id}",
                machine_id=m.id,
                machine_code=m.machine_code,
                machine_name=m.machine_name,
                alert_type="SENSOR_ANOMALY",
                severity="WARNING",
                title=f"Telemetry Anomaly Detected (Score: {round(s.anomaly_score, 2)})",
                message=f"Multivariate sensor divergence detected: Temp={s.temperature}°C, Vib={s.vibration}mm/s, Press={s.pressure}bar.",
                metric_value=s.anomaly_score,
                metric_unit="score",
                timestamp=s.timestamp,
            )
        )

    # Sort alerts by timestamp descending
    alerts.sort(key=lambda a: a.timestamp, reverse=True)

    # Filter by severity if requested
    if severity:
        alerts = [a for a in alerts if a.severity.upper() == severity.upper().strip()]

    return alerts
