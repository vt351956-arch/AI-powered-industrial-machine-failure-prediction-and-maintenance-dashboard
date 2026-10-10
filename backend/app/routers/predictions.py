from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.machine import Machine
from app.models.prediction import Prediction
from app.models.user import User
from app.schemas.prediction import (
    PredictionInput,
    PredictionOutput,
    PredictionRecordResponse,
)
from app.services.ml_service import ml_service
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/predictions", tags=["Predictions"])


@router.post("/predict", response_model=PredictionOutput)
def predict_machine_health(
    payload: PredictionInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Evaluates real-time machine failure risk, health score (0-100), and anomaly divergence.
    If machine_id is provided, the result is persisted into the PostgreSQL predictions table
    and the machine's status is automatically updated according to risk.
    """
    # Run ML inference
    pred_result = ml_service.predict(
        temperature=payload.temperature,
        vibration=payload.vibration,
        pressure=payload.pressure,
        rpm=payload.rpm,
        power_consumption=payload.power_consumption,
        operating_hours=payload.operating_hours,
    )

    pred_time = datetime.now(timezone.utc)
    pred_id = None

    # Persist prediction to database if machine_id is passed and valid
    if payload.machine_id:
        machine = db.query(Machine).filter(Machine.id == payload.machine_id).first()
        if machine:
            db_prediction = Prediction(
                machine_id=machine.id,
                prediction_time=pred_time,
                failure_probability=pred_result["failure_probability"],
                health_score=pred_result["health_score"],
                risk_level=pred_result["risk_level"],
                predicted_failure=pred_result["predicted_failure"],
                model_version=pred_result["model_version"],
            )
            db.add(db_prediction)

            # Auto-align machine status if machine is not manually set to OFFLINE
            if machine.status != "OFFLINE":
                if pred_result["risk_level"] == "HIGH":
                    machine.status = "CRITICAL"
                elif pred_result["risk_level"] == "MEDIUM":
                    machine.status = "WARNING"
                else:
                    machine.status = "HEALTHY"

            db.commit()
            db.refresh(db_prediction)
            pred_id = db_prediction.id

    return PredictionOutput(
        failure_probability=pred_result["failure_probability"],
        health_score=pred_result["health_score"],
        risk_level=pred_result["risk_level"],
        predicted_failure=pred_result["predicted_failure"],
        model_version=pred_result["model_version"],
        anomaly_detected=pred_result["anomaly_detected"],
        anomaly_score=pred_result["anomaly_score"],
        prediction_time=pred_time,
        prediction_id=pred_id,
        machine_id=payload.machine_id,
    )


@router.get("", response_model=List[PredictionRecordResponse])
def get_prediction_history(
    machine_id: Optional[str] = Query(None, description="Filter by machine ID"),
    risk_level: Optional[str] = Query(None, description="Filter by risk level (LOW, MEDIUM, HIGH)"),
    limit: int = Query(50, ge=1, le=500),
    skip: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Fetches historical prediction records stored in PostgreSQL.
    """
    query = db.query(Prediction)

    if machine_id:
        query = query.filter(Prediction.machine_id == machine_id)
    if risk_level:
        query = query.filter(Prediction.risk_level == risk_level.upper().strip())

    records = (
        query.order_by(desc(Prediction.prediction_time))
        .offset(skip)
        .limit(limit)
        .all()
    )
    return records


@router.get("/model-info")
def get_model_information(current_user: User = Depends(get_current_user)):
    """
    Returns active ML model metadata, architecture details, feature importances,
    and synthetic benchmark evaluation results.
    """
    metrics = ml_service.get_model_metrics()
    return {
        "status": "operational",
        "model_architecture": "Random Forest Classifier (Ensemble) + Isolation Forest (Anomaly)",
        "training_data_notice": "Academic / Benchmark prototype trained on physics-grounded synthetic industrial telemetry.",
        **metrics,
    }
