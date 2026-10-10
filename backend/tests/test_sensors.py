import pytest


@pytest.fixture
def created_machine(client, engineer_headers):
    payload = {
        "machine_code": "SENSOR-MTR-01",
        "machine_name": "Sensor Test Motor",
        "machine_type": "Induction Motor",
        "location": "Bay 9",
        "installation_date": "2023-05-15",
        "status": "HEALTHY",
    }
    res = client.post("/api/machines", json=payload, headers=engineer_headers)
    return res.json()


def test_add_sensor_reading(client, engineer_headers, created_machine):
    reading_payload = {
        "machine_id": created_machine["id"],
        "temperature": 68.4,
        "vibration": 2.1,
        "pressure": 4.1,
        "rpm": 1780.0,
        "power_consumption": 14.5,
        "operating_hours": 1200.0,
    }
    res = client.post("/api/sensors", json=reading_payload, headers=engineer_headers)
    assert res.status_code == 201
    data = res.json()
    assert data["temperature"] == 68.4
    assert data["vibration"] == 2.1
    assert "is_anomaly" in data
    assert "anomaly_score" in data


def test_add_sensor_reading_nonexistent_machine(client, engineer_headers):
    reading_payload = {
        "machine_id": "fake-machine-uuid",
        "temperature": 70.0,
        "vibration": 2.0,
        "pressure": 4.0,
        "rpm": 1800.0,
        "power_consumption": 15.0,
        "operating_hours": 100.0,
    }
    res = client.post("/api/sensors", json=reading_payload, headers=engineer_headers)
    assert res.status_code == 404


def test_get_sensor_readings(client, engineer_headers, created_machine):
    res = client.get(f"/api/sensors?machine_id={created_machine['id']}", headers=engineer_headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)
