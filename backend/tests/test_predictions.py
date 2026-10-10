import pytest


def test_predict_endpoint_normal_telemetry(client, engineer_headers):
    payload = {
        "temperature": 65.0,
        "vibration": 2.2,
        "pressure": 4.2,
        "rpm": 1780.0,
        "power_consumption": 14.5,
        "operating_hours": 1500.0,
    }
    res = client.post("/api/predictions/predict", json=payload, headers=engineer_headers)
    assert res.status_code == 200
    data = res.json()
    assert "failure_probability" in data
    assert "health_score" in data
    assert "risk_level" in data
    assert "predicted_failure" in data
    assert "model_version" in data
    assert 0.0 <= data["failure_probability"] <= 1.0
    assert 0.0 <= data["health_score"] <= 100.0
    assert data["risk_level"] in ["LOW", "MEDIUM", "HIGH"]


def test_predict_endpoint_severe_thermal_vibration(client, engineer_headers):
    # Extreme abnormal inputs representing impending bearing / thermal failure
    payload = {
        "temperature": 110.0,
        "vibration": 14.5,
        "pressure": 1.2,
        "rpm": 1200.0,
        "power_consumption": 48.0,
        "operating_hours": 11000.0,
    }
    res = client.post("/api/predictions/predict", json=payload, headers=engineer_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["risk_level"] in ["MEDIUM", "HIGH"]
    assert data["health_score"] < 70.0


def test_predict_endpoint_input_validation(client, engineer_headers):
    # Invalid negative RPM / out of range temperature
    payload = {
        "temperature": -50.0,
        "vibration": -5.0,
        "pressure": 4.0,
        "rpm": -100.0,
        "power_consumption": 10.0,
        "operating_hours": 100.0,
    }
    res = client.post("/api/predictions/predict", json=payload, headers=engineer_headers)
    assert res.status_code == 422


def test_model_info_endpoint(client, engineer_headers):
    res = client.get("/api/predictions/model-info", headers=engineer_headers)
    assert res.status_code == 200
    data = res.json()
    assert "model_version" in data
    assert "metrics" in data or "status" in data
