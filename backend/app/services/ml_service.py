import json
import logging
import os
from pathlib import Path
from typing import Dict, Any, Optional
import joblib
import numpy as np
import pandas as pd
from app.config import settings

logger = logging.getLogger("uvicorn.error")

FEATURE_NAMES = [
    "temperature",
    "vibration",
    "pressure",
    "rpm",
    "power_consumption",
    "operating_hours",
]


class MLService:
    def __init__(self):
        self.rf_model = None
        self.if_model = None
        self.scaler = None
        self.metrics: Dict[str, Any] = {}
        self.model_version: str = settings.MODEL_VERSION
        self.is_loaded: bool = False
        self._load_or_train_models()

    def _resolve_model_dir(self) -> Path:
        """
        Search candidate locations for model artifacts.
        """
        candidates = [
            Path(settings.MODEL_DIR),
            Path.cwd() / "ml" / "models",
            Path.cwd() / ".." / "ml" / "models",
            Path(__file__).resolve().parent.parent.parent.parent / "ml" / "models",
            Path(__file__).resolve().parent.parent.parent / "ml" / "models",
        ]
        for c in candidates:
            if c.exists() and (c / "rf_model.joblib").exists():
                return c.resolve()
        
        # Default fallback to project root / ml / models
        default_path = Path.cwd() / "ml" / "models"
        default_path.mkdir(parents=True, exist_ok=True)
        return default_path.resolve()

    def _load_or_train_models(self):
        model_dir = self._resolve_model_dir()
        rf_path = model_dir / "rf_model.joblib"
        if_path = model_dir / "if_model.joblib"
        scaler_path = model_dir / "scaler.joblib"
        metrics_path = model_dir / "metrics.json"

        if rf_path.exists() and scaler_path.exists():
            try:
                self.rf_model = joblib.load(rf_path)
                self.scaler = joblib.load(scaler_path)
                if if_path.exists():
                    self.if_model = joblib.load(if_path)
                if metrics_path.exists():
                    with open(metrics_path, "r") as f:
                        self.metrics = json.load(f)
                self.is_loaded = True
                logger.info(f"[ML SERVICE] Successfully loaded models from {model_dir}")
                return
            except Exception as e:
                logger.warning(f"[ML SERVICE] Error loading existing models from {model_dir}: {e}. Triggering re-train.")

        # If models don't exist yet, run training pipeline
        logger.info("[ML SERVICE] Pre-trained models not found. Triggering automated model training...")
        try:
            from ml.train_model import train_and_evaluate
            self.metrics = train_and_evaluate(output_dir=str(model_dir))
            self.rf_model = joblib.load(rf_path)
            self.scaler = joblib.load(scaler_path)
            if if_path.exists():
                self.if_model = joblib.load(if_path)
            self.is_loaded = True
            logger.info("[ML SERVICE] Automated training completed and models loaded successfully.")
        except Exception as exc:
            logger.error(f"[ML SERVICE CRITICAL] Could not train or load ML models: {exc}")
            self.is_loaded = False

    def predict(
        self,
        temperature: float,
        vibration: float,
        pressure: float,
        rpm: float,
        power_consumption: float,
        operating_hours: float
    ) -> Dict[str, Any]:
        """
        Executes ML inference over industrial telemetry.
        Returns:
            failure_probability, health_score, risk_level, predicted_failure,
            anomaly_detected, anomaly_score, model_version
        """
        if not self.is_loaded or self.rf_model is None or self.scaler is None:
            self._load_or_train_models()
            if not self.is_loaded:
                raise RuntimeError("Machine Learning inference engine is unavailable.")

        raw_df = pd.DataFrame([[
            temperature,
            vibration,
            pressure,
            rpm,
            power_consumption,
            operating_hours
        ]], columns=FEATURE_NAMES)

        scaled_vector = self.scaler.transform(raw_df)

        # 1. Random Forest Classification
        prob_array = self.rf_model.predict_proba(scaled_vector)
        # Class 1 is failure
        failure_prob = float(prob_array[0][1]) if prob_array.shape[1] > 1 else float(prob_array[0][0])
        failure_prob = round(float(np.clip(failure_prob, 0.0, 1.0)), 4)

        # 2. Machine Health Score (0 - 100)
        # Higher failure prob -> lower health score
        health_score = round(max(0.0, min(100.0, (1.0 - failure_prob) * 100.0)), 1)

        # 3. Risk Level (Risk logic: 0-30 = LOW, 31-70 = MEDIUM, 71-100 = HIGH)
        risk_pct = failure_prob * 100.0
        if risk_pct <= 30.0:
            risk_level = "LOW"
        elif risk_pct <= 70.0:
            risk_level = "MEDIUM"
        else:
            risk_level = "HIGH"

        predicted_failure = bool(failure_prob >= 0.50)

        # 4. Unsupervised Anomaly Detection (Isolation Forest)
        anomaly_detected = False
        anomaly_score = 0.0
        if self.if_model is not None:
            try:
                if_pred = self.if_model.predict(scaled_vector)[0]  # -1 for anomaly, 1 for normal
                raw_decision = float(self.if_model.decision_function(scaled_vector)[0])
                anomaly_detected = bool(if_pred == -1)
                # Invert decision score so higher positive = higher outlier divergence
                anomaly_score = round(float(-raw_decision), 4)
            except Exception as e:
                logger.warning(f"[ML ANOMALY] Isolation forest error: {e}")

        return {
            "failure_probability": failure_prob,
            "health_score": health_score,
            "risk_level": risk_level,
            "predicted_failure": predicted_failure,
            "model_version": self.model_version,
            "anomaly_detected": anomaly_detected,
            "anomaly_score": anomaly_score,
        }

    def get_model_metrics(self) -> Dict[str, Any]:
        """
        Return training metrics and feature importances.
        """
        return self.metrics or {
            "model_version": self.model_version,
            "status": "active",
            "feature_names": FEATURE_NAMES
        }


ml_service = MLService()
