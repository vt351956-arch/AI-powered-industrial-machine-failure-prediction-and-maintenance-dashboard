import pytest


@pytest.fixture
def created_machine(client, engineer_headers):
    payload = {
        "machine_code": "MAINT-TURB-01",
        "machine_name": "Maintenance Gas Turbine",
        "machine_type": "Gas Turbine",
        "location": "Sector 5",
        "installation_date": "2022-04-10",
        "status": "CRITICAL",
    }
    res = client.post("/api/machines", json=payload, headers=engineer_headers)
    return res.json()


def test_create_maintenance_record(client, engineer_headers, created_machine):
    maint_payload = {
        "machine_id": created_machine["id"],
        "maintenance_date": "2025-01-20",
        "maintenance_type": "OVERHAUL",
        "description": "Comprehensive rotor balance and high-temp seal replacement",
        "technician": "Sarah Vance, Master Tech",
        "cost": 3200.0,
    }
    res = client.post("/api/maintenance", json=maint_payload, headers=engineer_headers)
    assert res.status_code == 201
    data = res.json()
    assert data["maintenance_type"] == "OVERHAUL"
    assert data["cost"] == 3200.0

    # Verify that an OVERHAUL resets machine status from CRITICAL to HEALTHY
    mach_res = client.get(f"/api/machines/{created_machine['id']}", headers=engineer_headers)
    assert mach_res.json()["status"] == "HEALTHY"


def test_list_maintenance_records(client, engineer_headers, created_machine):
    res = client.get(f"/api/maintenance?machine_id={created_machine['id']}", headers=engineer_headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_delete_maintenance_as_viewer_forbidden(client, viewer_headers):
    res = client.delete("/api/maintenance/fake-record-id", headers=viewer_headers)
    assert res.status_code == 403
