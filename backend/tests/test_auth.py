import pytest


def test_user_registration_success(client):
    res = client.post(
        "/api/auth/register",
        json={
            "name": "Sarah Connor",
            "email": "sarah.connor@plant.com",
            "password": "Password123!",
            "role": "engineer",
        },
    )
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "sarah.connor@plant.com"
    assert data["user"]["role"] == "engineer"


def test_duplicate_registration_fails(client, engineer_user):
    res = client.post(
        "/api/auth/register",
        json={
            "name": "Duplicate User",
            "email": engineer_user.email,
            "password": "AnyPassword123!",
            "role": "engineer",
        },
    )
    assert res.status_code == 400
    assert "already exists" in res.json()["detail"]


def test_login_success(client, engineer_user):
    res = client.post(
        "/api/auth/login",
        json={
            "email": engineer_user.email,
            "password": "EngineerPass123!",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == engineer_user.email


def test_login_invalid_password(client, engineer_user):
    res = client.post(
        "/api/auth/login",
        json={
            "email": engineer_user.email,
            "password": "WrongPassword999",
        },
    )
    assert res.status_code == 401


def test_get_current_profile(client, engineer_headers, engineer_user):
    res = client.get("/api/auth/me", headers=engineer_headers)
    assert res.status_code == 200
    assert res.json()["email"] == engineer_user.email


def test_unauthorized_profile_access(client):
    res = client.get("/api/auth/me")
    assert res.status_code == 401
