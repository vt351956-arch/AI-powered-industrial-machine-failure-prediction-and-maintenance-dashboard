"""
Model Training Pipeline for AI-Powered Predictive Maintenance for Industry 4.0
Trains:
  1. Random Forest Classifier for failure probability and risk classification.
  2. Isolation Forest for unsupervised anomaly detection.

Metrics are evaluated honestly and reported on synthetic/demo industrial telemetry.
"""

import json
import os
import sys
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# Ensure root workspace is on path
current_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(current_dir))

from dataset_generator import generate_synthetic_maintenance_dataset


FEATURE_COLS = [
    "temperature",
    "vibration",
    "pressure",
    "rpm",
    "power_consumption",
    "operating_hours",
]
TARGET_COL = "failure"


def train_and_evaluate(
    data_path: str = None,
    n_samples: int = 3500,
    output_dir: str = None,
    random_seed: int = 42,
):
    print("=" * 70)
    print(" INDUSTRY 4.0 PREDICTIVE MAINTENANCE: ML PIPELINE TRAINING")
    print(" NOTE: Results are evaluated on SYNTHETIC/DEMO benchmark telemetry.")
    print("=" * 70)

    # 1. Load / Synthesize Dataset
    if data_path and os.path.exists(data_path):
        print(f"\n[1/6] Loading historical dataset from: {data_path}")
        df = pd.read_csv(data_path)
    else:
        print(f"\n[1/6] Synthesizing physics-based benchmark dataset ({n_samples} records)...")
        df = generate_synthetic_maintenance_dataset(n_samples=n_samples, random_seed=random_seed)

    # 2. Validate Dataset
    print("\n[2/6] Validating dataset schema and integrity...")
    missing_cols = [c for c in FEATURE_COLS + [TARGET_COL] if c not in df.columns]
    if missing_cols:
        raise ValueError(f"Dataset missing required columns: {missing_cols}")

    initial_len = len(df)
    print(f"  - Total records: {initial_len}")
    print(f"  - Feature variables: {FEATURE_COLS}")
    print(f"  - Target distribution:\n{df[TARGET_COL].value_counts().to_dict()}")

    # 3. Handle Missing Values
    print("\n[3/6] Checking and cleaning missing / null values...")
    null_counts = df[FEATURE_COLS].isnull().sum().sum()
    if null_counts > 0:
        print(f"  - Found {null_counts} missing cells. Imputing with column medians...")
        df[FEATURE_COLS] = df[FEATURE_COLS].fillna(df[FEATURE_COLS].median())
    else:
        print("  - Zero missing values detected. Dataset is clean.")

    # 4. Split Train/Test
    print("\n[4/6] Stratified train-test split (80% Train, 20% Test)...")
    X = df[FEATURE_COLS]
    y = df[TARGET_COL]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=random_seed, stratify=y
    )

    # Preprocessing: StandardScaler
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # 5. Train Random Forest Classifier
    print("\n[5/6] Training Random Forest Classifier (n_estimators=100, max_depth=10)...", flush=True)
    rf_classifier = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=random_seed,
        class_weight="balanced",
        n_jobs=1,
    )
    rf_classifier.fit(X_train_scaled, y_train)

    # Train Isolation Forest for Unsupervised Anomaly Detection
    print("  - Training Isolation Forest for unsupervised outlier detection...", flush=True)
    iso_forest = IsolationForest(
        n_estimators=100,
        contamination=0.08,
        random_state=random_seed,
        n_jobs=1,
    )
    # Fit isolation forest on normal operating regime
    normal_train = X_train_scaled[y_train == 0]
    iso_forest.fit(normal_train)

    # 6. Evaluation on Hold-Out Test Set
    print("\n[6/6] Evaluating model on Hold-Out Test Set...")
    y_pred = rf_classifier.predict(X_test_scaled)
    y_proba = rf_classifier.predict_proba(X_test_scaled)[:, 1]

    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, zero_division=0))
    rec = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    roc_auc = float(roc_auc_score(y_test, y_proba))
    cm = confusion_matrix(y_test, y_pred).tolist()

    print("-" * 55)
    print(f" EVALUATION METRICS (Synthetic Industrial Benchmark):")
    print(f"  - Accuracy:         {acc:.4f} ({acc * 100:.2f}%)")
    print(f"  - Precision:        {prec:.4f} ({prec * 100:.2f}%)")
    print(f"  - Recall:           {rec:.4f} ({rec * 100:.2f}%)")
    print(f"  - F1-Score:         {f1:.4f}")
    print(f"  - ROC-AUC:          {roc_auc:.4f}")
    print("-" * 55)
    print(" Confusion Matrix [[TN, FP], [FN, TP]]:")
    print(f"  [[{cm[0][0]:>5}, {cm[0][1]:>5}],")
    print(f"   [{cm[1][0]:>5}, {cm[1][1]:>5}]]")
    print("-" * 55)

    # Feature Importances
    importances = dict(zip(FEATURE_COLS, [float(x) for x in rf_classifier.feature_importances_]))
    print(" Feature Importances:")
    for feat, imp in sorted(importances.items(), key=lambda item: item[1], reverse=True):
        print(f"  - {feat:<20}: {imp:.4f}")
    print("-" * 55)

    # Save artifacts
    if output_dir is None:
        output_dir = current_dir / "models"
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    rf_file = output_path / "rf_model.joblib"
    if_file = output_path / "if_model.joblib"
    scaler_file = output_path / "scaler.joblib"
    metrics_file = output_path / "metrics.json"

    joblib.dump(rf_classifier, rf_file)
    joblib.dump(iso_forest, if_file)
    joblib.dump(scaler, scaler_file)

    metrics_payload = {
        "model_version": "random-forest-v1",
        "dataset_type": "physics-grounded-synthetic",
        "sample_count": len(df),
        "test_sample_count": len(X_test),
        "metrics": {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "roc_auc": round(roc_auc, 4),
            "confusion_matrix": cm,
        },
        "feature_importances": {k: round(v, 4) for k, v in importances.items()},
        "feature_names": FEATURE_COLS,
    }

    with open(metrics_file, "w") as f:
        json.dump(metrics_payload, f, indent=2)

    print(f"\n[SUCCESS] Models and metadata successfully saved to: {output_path}")
    print(f"  - {rf_file.name}")
    print(f"  - {if_file.name}")
    print(f"  - {scaler_file.name}")
    print(f"  - {metrics_file.name}")
    print("=" * 70)

    return metrics_payload


if __name__ == "__main__":
    train_and_evaluate()
