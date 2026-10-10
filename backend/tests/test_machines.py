import pytest


def test_create_machine_as_engineer(client, engineer_headers):
    payload = {
        "machine_code": "TEST-PUMP-01",
        "machine_name": "Test Coolant Pump",
        "machine_type": "Centrifugal Pump",
        "location": "Bay 4",
        "installation_date": "2023-01-10",
        "status": "HEALTHY",
    }
    res = client.post("/api/machines", json=payload, headers=engineer_headers)
    assert res.status_code == 201
    data = res.json()
    assert data["machine_code"] == "TEST-PUMP-01"
    assert data["status"] == "HEALTHY"


def test_create_duplicate_machine_code_fails(client, engineer_headers):
    payload = {
        "machine_code": "DUP-PUMP-01",
        "machine_name": "Pump Initial",
        "machine_type": "Centrifugal Pump",
        "location": "Bay 1",
        "installation_date": "2023-01-10",
        "status": "HEALTHY",
    }
    client.post("/api/machines", json=payload, headers=engineer_headers)
    res = client.post("/api/machines", json=payload, headers=engineer_headers)
    assert res.status_code == 400


def test_viewer_cannot_create_machine(client, viewer_headers):
    payload = {
        "machine_code": "VIEWER-PUMP-01",
        "machine_name": "Viewer Pump",
        "machine_type": "Pump",
        "location": "Bay 2",
        "installation_date": "2023-01-10",
        "status": "HEALTHY",
    }
    res = client.post("/api/machines", json=payload, headers=viewer_headers)
    assert res.status_code == 403


def test_list_machines(client, engineer_headers):
    res = client.get("/api/machines", headers=engineer_headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_get_machine_detail_not_found(client, engineer_headers):
    res = client.get("/api/machines/non-existent-uuid", headers=engineer_headers)
    assert res.status_code == 404
