# API Documentation

## Base URL
```
http://localhost:8000/api
```

## Authentication

All protected endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Register User
- **Endpoint**: `POST /api/auth/register`
- **Authentication**: None
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "viewer"
}
```
- **Response** (201):
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "viewer",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Login
- **Endpoint**: `POST /api/auth/login`
- **Authentication**: None
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
- **Response** (200):
```json
{
  "access_token": "jwt_token_here",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "viewer"
  }
}
```

### Logout
- **Endpoint**: `POST /api/auth/logout`
- **Authentication**: Required
- **Response** (200):
```json
{
  "message": "Successfully logged out"
}
```

## Machines

### List Machines
- **Endpoint**: `GET /api/machines`
- **Authentication**: Required
- **Query Parameters**:
  - `search` (optional): Search by code, name, or location
  - `status` (optional): Filter by status (HEALTHY, WARNING, CRITICAL, OFFLINE)
  - `machine_type` (optional): Filter by machine type
  - `limit` (optional): Number of results (default: 50)
  - `skip` (optional): Number of results to skip (default: 0)
- **Response** (200):
```json
[
  {
    "id": "uuid",
    "machine_code": "MCH-001",
    "machine_name": "CNC Machine 1",
    "machine_type": "CNC",
    "location": "Production Line A",
    "installation_date": "2023-01-15",
    "status": "HEALTHY",
    "latest_health_score": 95.5,
    "latest_failure_probability": 0.05,
    "latest_risk_level": "LOW",
    "total_predictions": 150
  }
]
```

### Create Machine
- **Endpoint**: `POST /api/machines`
- **Authentication**: Required (admin, engineer)
- **Request Body**:
```json
{
  "machine_code": "MCH-002",
  "machine_name": "CNC Machine 2",
  "machine_type": "CNC",
  "location": "Production Line B",
  "installation_date": "2023-06-01",
  "status": "HEALTHY"
}
```
- **Response** (201):
```json
{
  "id": "uuid",
  "machine_code": "MCH-002",
  "machine_name": "CNC Machine 2",
  "machine_type": "CNC",
  "location": "Production Line B",
  "installation_date": "2023-06-01",
  "status": "HEALTHY",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Get Machine Details
- **Endpoint**: `GET /api/machines/{id}`
- **Authentication**: Required
- **Response** (200):
```json
{
  "id": "uuid",
  "machine_code": "MCH-001",
  "machine_name": "CNC Machine 1",
  "machine_type": "CNC",
  "location": "Production Line A",
  "installation_date": "2023-01-15",
  "status": "HEALTHY",
  "latest_health_score": 95.5,
  "latest_failure_probability": 0.05,
  "latest_risk_level": "LOW",
  "total_predictions": 150,
  "total_operating_hours": 8500.5,
  "latest_sensor_reading": {
    "id": "uuid",
    "machine_id": "uuid",
    "temperature": 75.5,
    "vibration": 2.3,
    "pressure": 3.5,
    "rpm": 1800,
    "power_consumption": 25.5,
    "operating_hours": 8500.5,
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

### Update Machine
- **Endpoint**: `PUT /api/machines/{id}`
- **Authentication**: Required (admin, engineer)
- **Request Body**:
```json
{
  "machine_name": "Updated Machine Name",
  "location": "New Location",
  "status": "WARNING"
}
```
- **Response** (200):
```json
{
  "id": "uuid",
  "machine_code": "MCH-001",
  "machine_name": "Updated Machine Name",
  "machine_type": "CNC",
  "location": "New Location",
  "installation_date": "2023-01-15",
  "status": "WARNING",
  "updated_at": "2024-01-01T12:00:00Z"
}
```

### Delete Machine
- **Endpoint**: `DELETE /api/machines/{id}`
- **Authentication**: Required (admin)
- **Response** (204): No content

## Sensors

### List Sensor Readings
- **Endpoint**: `GET /api/sensors`
- **Authentication**: Required
- **Query Parameters**:
  - `machine_id` (optional): Filter by machine
  - `limit` (optional): Number of results (default: 50)
  - `skip` (optional): Number of results to skip (default: 0)
- **Response** (200):
```json
[
  {
    "id": "uuid",
    "machine_id": "uuid",
    "temperature": 75.5,
    "vibration": 2.3,
    "pressure": 3.5,
    "rpm": 1800,
    "power_consumption": 25.5,
    "operating_hours": 8500.5,
    "timestamp": "2024-01-01T12:00:00Z"
  }
]
```

### Get Latest Sensor Reading
- **Endpoint**: `GET /api/sensors/latest/{machine_id}`
- **Authentication**: Required
- **Response** (200):
```json
{
  "id": "uuid",
  "machine_id": "uuid",
  "temperature": 75.5,
  "vibration": 2.3,
  "pressure": 3.5,
  "rpm": 1800,
  "power_consumption": 25.5,
  "operating_hours": 8500.5,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## Predictions

### Run Prediction
- **Endpoint**: `POST /api/predictions/predict`
- **Authentication**: Required
- **Request Body**:
```json
{
  "machine_id": "uuid",
  "temperature": 75.5,
  "vibration": 2.3,
  "pressure": 3.5,
  "rpm": 1800,
  "power_consumption": 25.5,
  "operating_hours": 8500.5
}
```
- **Response** (200):
```json
{
  "failure_probability": 0.15,
  "health_score": 85.0,
  "risk_level": "LOW",
  "predicted_failure": false,
  "model_version": "random-forest-v1",
  "anomaly_detected": false,
  "anomaly_score": 0.0,
  "prediction_time": "2024-01-01T12:00:00Z",
  "prediction_id": "uuid",
  "machine_id": "uuid"
}
```

### Get Prediction History
- **Endpoint**: `GET /api/predictions`
- **Authentication**: Required
- **Query Parameters**:
  - `machine_id` (optional): Filter by machine
  - `risk_level` (optional): Filter by risk level (LOW, MEDIUM, HIGH)
  - `limit` (optional): Number of results (default: 50)
  - `skip` (optional): Number of results to skip (default: 0)
- **Response** (200):
```json
[
  {
    "id": "uuid",
    "machine_id": "uuid",
    "prediction_time": "2024-01-01T12:00:00Z",
    "failure_probability": 0.15,
    "health_score": 85.0,
    "risk_level": "LOW",
    "predicted_failure": false,
    "model_version": "random-forest-v1"
  }
]
```

### Get Model Information
- **Endpoint**: `GET /api/predictions/model-info`
- **Authentication**: Required
- **Response** (200):
```json
{
  "status": "operational",
  "model_architecture": "Random Forest Classifier (Ensemble) + Isolation Forest (Anomaly)",
  "training_data_notice": "Academic / Benchmark prototype trained on physics-grounded synthetic industrial telemetry.",
  "model_version": "random-forest-v1",
  "metrics": {
    "accuracy": 0.9986,
    "f1_score": 0.997,
    "roc_auc": 0.999,
    "feature_importance": {
      "temperature": 0.35,
      "vibration": 0.25,
      "pressure": 0.15,
      "rpm": 0.10,
      "power_consumption": 0.10,
      "operating_hours": 0.05
    }
  }
}
```

## Alerts

### Get System Alerts
- **Endpoint**: `GET /api/alerts`
- **Authentication**: Required
- **Query Parameters**:
  - `risk_level` (optional): Filter by risk level (HIGH, MEDIUM, LOW)
  - `machine_id` (optional): Filter by machine
  - `severity` (optional): Filter by severity (CRITICAL, WARNING, INFO)
- **Response** (200):
```json
[
  {
    "id": "pred-risk-uuid",
    "machine_id": "uuid",
    "machine_code": "MCH-001",
    "machine_name": "CNC Machine 1",
    "alert_type": "HIGH_RISK",
    "severity": "CRITICAL",
    "title": "HIGH Failure Probability (87.0%)",
    "message": "Model random-forest-v1 estimated health score of 32.0/100. Failure risk is elevated.",
    "metric_value": 0.87,
    "metric_unit": "prob",
    "timestamp": "2024-01-01T12:00:00Z"
  }
]
```

## Maintenance

### List Maintenance Records
- **Endpoint**: `GET /api/maintenance`
- **Authentication**: Required
- **Query Parameters**:
  - `machine_id` (optional): Filter by machine
  - `maintenance_type` (optional): Filter by type (PREVENTIVE, CORRECTIVE, INSPECTION, OVERHAUL)
  - `limit` (optional): Number of results (default: 100)
  - `skip` (optional): Number of results to skip (default: 0)
- **Response** (200):
```json
[
  {
    "id": "uuid",
    "machine_id": "uuid",
    "machine_name": "CNC Machine 1",
    "machine_code": "MCH-001",
    "maintenance_date": "2024-01-15",
    "maintenance_type": "PREVENTIVE",
    "description": "Routine bearing lubrication and vibration check",
    "technician": "John Doe",
    "cost": 450.0,
    "created_at": "2024-01-15T08:00:00Z"
  }
]
```

### Create Maintenance Record
- **Endpoint**: `POST /api/maintenance`
- **Authentication**: Required (admin, engineer)
- **Request Body**:
```json
{
  "machine_id": "uuid",
  "maintenance_date": "2024-01-15",
  "maintenance_type": "PREVENTIVE",
  "description": "Routine bearing lubrication and vibration check",
  "technician": "John Doe",
  "cost": 450.0
}
```
- **Response** (201):
```json
{
  "id": "uuid",
  "machine_id": "uuid",
  "machine_name": "CNC Machine 1",
  "machine_code": "MCH-001",
  "maintenance_date": "2024-01-15",
  "maintenance_type": "PREVENTIVE",
  "description": "Routine bearing lubrication and vibration check",
  "technician": "John Doe",
  "cost": 450.0,
  "created_at": "2024-01-15T08:00:00Z"
}
```

### Get Maintenance Record
- **Endpoint**: `GET /api/maintenance/{record_id}`
- **Authentication**: Required
- **Response** (200):
```json
{
  "id": "uuid",
  "machine_id": "uuid",
  "machine_name": "CNC Machine 1",
  "machine_code": "MCH-001",
  "maintenance_date": "2024-01-15",
  "maintenance_type": "PREVENTIVE",
  "description": "Routine bearing lubrication and vibration check",
  "technician": "John Doe",
  "cost": 450.0,
  "created_at": "2024-01-15T08:00:00Z"
}
```

### Update Maintenance Record
- **Endpoint**: `PUT /api/maintenance/{record_id}`
- **Authentication**: Required (admin, engineer)
- **Request Body**:
```json
{
  "maintenance_date": "2024-01-16",
  "description": "Updated description",
  "cost": 500.0
}
```
- **Response** (200):
```json
{
  "id": "uuid",
  "machine_id": "uuid",
  "machine_name": "CNC Machine 1",
  "machine_code": "MCH-001",
  "maintenance_date": "2024-01-16",
  "maintenance_type": "PREVENTIVE",
  "description": "Updated description",
  "technician": "John Doe",
  "cost": 500.0,
  "created_at": "2024-01-15T08:00:00Z"
}
```

### Delete Maintenance Record
- **Endpoint**: `DELETE /api/maintenance/{record_id}`
- **Authentication**: Required (admin)
- **Response** (204): No content

## Dashboard

### Get Dashboard Summary
- **Endpoint**: `GET /api/dashboard/summary`
- **Authentication**: Required
- **Response** (200):
```json
{
  "total_machines": 10,
  "healthy_machines": 7,
  "warning_machines": 2,
  "critical_machines": 1,
  "total_predictions": 500,
  "high_risk_predictions": 25,
  "total_maintenance_records": 150,
  "total_maintenance_cost": 75000.0,
  "health_trend": [
    {
      "date": "2024-01-01",
      "avg_health_score": 85.5
    }
  ],
  "failure_risk_distribution": [
    {
      "date": "2024-01-01",
      "healthy": 7,
      "warning": 2,
      "critical": 1
    }
  ],
  "sensor_trends": [
    {
      "timestamp": "2024-01-01T12:00:00Z",
      "temperature": 75.5,
      "vibration": 2.3,
      "pressure": 3.5,
      "rpm": 1800,
      "power_consumption": 25.5
    }
  ],
  "machine_health_comparison": [
    {
      "machine_code": "MCH-001",
      "machine_name": "CNC Machine 1",
      "health_score": 95.5,
      "status": "HEALTHY"
    }
  ],
  "maintenance_cost_trend": [
    {
      "date": "2024-01-01",
      "preventive_cost": 25000.0,
      "corrective_cost": 50000.0
    }
  ]
}
```

## Error Responses

All endpoints may return error responses:

### 401 Unauthorized
```json
{
  "detail": "Could not validate credentials"
}
```

### 403 Forbidden
```json
{
  "detail": "Not enough permissions"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 422 Validation Error
```json
{
  "detail": [
    {
      "loc": ["body", "field_name"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting for production use.

## CORS

CORS is configured to allow requests from the frontend origin:
```
CORS_ORIGINS=http://localhost:5173
```

## API Versioning

The API is currently at version 1. No version prefix is used in the URL. Future versions may include `/v1/` prefix.
