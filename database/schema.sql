-- ==============================================================================
-- AI-Powered Predictive Maintenance for Industry 4.0
-- Database Schema for PostgreSQL
-- ==============================================================================

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. USERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'engineer', 'viewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ------------------------------------------------------------------------------
-- 2. MACHINES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS machines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_code VARCHAR(50) UNIQUE NOT NULL,
    machine_name VARCHAR(100) NOT NULL,
    machine_type VARCHAR(50) NOT NULL,
    location VARCHAR(100) NOT NULL,
    installation_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('HEALTHY', 'WARNING', 'CRITICAL', 'OFFLINE')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_machines_code ON machines(machine_code);
CREATE INDEX IF NOT EXISTS idx_machines_status ON machines(status);
CREATE INDEX IF NOT EXISTS idx_machines_type ON machines(machine_type);

-- ------------------------------------------------------------------------------
-- 3. SENSOR READINGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sensor_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    temperature DOUBLE PRECISION NOT NULL,       -- in °C
    vibration DOUBLE PRECISION NOT NULL,         -- in mm/s RMS
    pressure DOUBLE PRECISION NOT NULL,          -- in bar
    rpm DOUBLE PRECISION NOT NULL,               -- Revolutions Per Minute
    power_consumption DOUBLE PRECISION NOT NULL, -- in kW
    operating_hours DOUBLE PRECISION NOT NULL,   -- Cumulative running hours
    is_anomaly BOOLEAN NOT NULL DEFAULT FALSE,
    anomaly_score DOUBLE PRECISION NOT NULL DEFAULT 0.0
);

CREATE INDEX IF NOT EXISTS idx_sensors_machine_id ON sensor_readings(machine_id);
CREATE INDEX IF NOT EXISTS idx_sensors_timestamp ON sensor_readings(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sensors_machine_timestamp ON sensor_readings(machine_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sensors_anomaly ON sensor_readings(is_anomaly);

-- ------------------------------------------------------------------------------
-- 4. PREDICTIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    prediction_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    failure_probability DOUBLE PRECISION NOT NULL, -- Float between 0.00 and 1.00
    health_score DOUBLE PRECISION NOT NULL,        -- Scale 0 to 100
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
    predicted_failure BOOLEAN NOT NULL,
    model_version VARCHAR(50) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_predictions_machine_id ON predictions(machine_id);
CREATE INDEX IF NOT EXISTS idx_predictions_prediction_time ON predictions(prediction_time DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_risk_level ON predictions(risk_level);
CREATE INDEX IF NOT EXISTS idx_predictions_machine_time ON predictions(machine_id, prediction_time DESC);

-- ------------------------------------------------------------------------------
-- 5. MAINTENANCE RECORDS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS maintenance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    maintenance_date DATE NOT NULL,
    maintenance_type VARCHAR(50) NOT NULL, -- PREVENTIVE, CORRECTIVE, INSPECTION, OVERHAUL
    description TEXT NOT NULL,
    technician VARCHAR(100) NOT NULL,
    cost DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_maintenance_machine_id ON maintenance_records(machine_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_date ON maintenance_records(maintenance_date DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_type ON maintenance_records(maintenance_type);

-- ------------------------------------------------------------------------------
-- SAMPLE VIEW FOR LATEST MACHINE STATUS AGGREGATION
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW view_machine_health_overview AS
SELECT 
    m.id AS machine_id,
    m.machine_code,
    m.machine_name,
    m.machine_type,
    m.status AS machine_status,
    p.health_score AS latest_health_score,
    p.failure_probability AS latest_failure_probability,
    p.risk_level AS latest_risk_level,
    p.prediction_time AS last_evaluated_at,
    s.temperature AS latest_temperature,
    s.vibration AS latest_vibration,
    s.pressure AS latest_pressure,
    s.rpm AS latest_rpm,
    s.power_consumption AS latest_power_consumption,
    s.operating_hours AS total_operating_hours
FROM machines m
LEFT JOIN LATERAL (
    SELECT health_score, failure_probability, risk_level, prediction_time
    FROM predictions
    WHERE machine_id = m.id
    ORDER BY prediction_time DESC
    LIMIT 1
) p ON true
LEFT JOIN LATERAL (
    SELECT temperature, vibration, pressure, rpm, power_consumption, operating_hours
    FROM sensor_readings
    WHERE machine_id = m.id
    ORDER BY timestamp DESC
    LIMIT 1
) s ON true;
