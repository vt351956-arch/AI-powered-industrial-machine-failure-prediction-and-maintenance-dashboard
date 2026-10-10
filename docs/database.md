# Database Documentation

## Overview

The system uses PostgreSQL as the relational database. The database schema is designed to support machine monitoring, sensor data collection, ML predictions, and maintenance tracking.

## Database Schema

### Entity Relationship Diagram

```
┌─────────────┐
│    users    │
└──────┬──────┘
       │
       │ (no direct FK)
       │
┌──────▼──────┐     ┌──────────────┐
│   machines  │◄────│ sensor_      │
└──────┬──────┘     │ readings    │
       │            └──────────────┘
       │
       ├─────────────┬──────────────┐
       │             │              │
┌──────▼──────┐ ┌───▼────────┐ ┌───▼──────────┐
│ predictions │ │maintenance │ │ (future:    │
│             │ │  _records  │ │  alerts)    │
└─────────────┘ └────────────┘ └──────────────┘
```

## Tables

### users

Stores user accounts for authentication and authorization.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | User unique identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email address |
| hashed_password | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| role | VARCHAR(50) | NOT NULL | User role (admin, engineer, viewer) |
| created_at | TIMESTAMP | DEFAULT NOW() | Account creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes**:
- `idx_users_email` on `email` (unique)

**Relationships**:
- No foreign key relationships (users are referenced by JWT tokens)

**Seeded Data**:
- admin@example.com (admin role)
- engineer@example.com (engineer role)
- viewer@example.com (viewer role)

---

### machines

Stores industrial equipment registry.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Machine unique identifier |
| machine_code | VARCHAR(50) | UNIQUE, NOT NULL | Machine code/identifier |
| machine_name | VARCHAR(255) | NOT NULL | Machine name |
| machine_type | VARCHAR(100) | NOT NULL | Machine type (CNC, Pump, Compressor, etc.) |
| location | VARCHAR(255) | NOT NULL | Physical location |
| installation_date | DATE | NOT NULL | Installation date |
| status | VARCHAR(50) | NOT NULL | Current status (HEALTHY, WARNING, CRITICAL, OFFLINE) |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes**:
- `idx_machines_code` on `machine_code` (unique)
- `idx_machines_status` on `status`
- `idx_machines_type` on `machine_type`

**Relationships**:
- One-to-many with `sensor_readings`
- One-to-many with `predictions`
- One-to-many with `maintenance_records`

**Status Values**:
- `HEALTHY`: Machine operating normally
- `WARNING`: Elevated risk detected
- `CRITICAL`: High risk, immediate attention required
- `OFFLINE`: Machine not in operation

---

### sensor_readings

Stores time-series sensor data from machines.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Reading unique identifier |
| machine_id | UUID | FOREIGN KEY → machines.id, NOT NULL | Associated machine |
| temperature | FLOAT | NOT NULL | Temperature in °C |
| vibration | FLOAT | NOT NULL | Vibration in mm/s RMS |
| pressure | FLOAT | NOT NULL | Pressure in bar |
| rpm | FLOAT | NOT NULL | Rotations per minute |
| power_consumption | FLOAT | NOT NULL | Power consumption in kW |
| operating_hours | FLOAT | NOT NULL | Total operating hours |
| is_anomaly | BOOLEAN | DEFAULT FALSE | Isolation Forest anomaly flag |
| anomaly_score | FLOAT | NULL | Isolation Forest anomaly score |
| timestamp | TIMESTAMP | NOT NULL | Reading timestamp |

**Indexes**:
- `idx_sensors_machine` on `machine_id`
- `idx_sensors_timestamp` on `timestamp`
- `idx_sensors_anomaly` on `is_anomaly`
- Composite index on `(machine_id, timestamp)`

**Relationships**:
- Many-to-one with `machines`

**Data Volume**:
- High write volume (continuous sensor data)
- Consider partitioning by timestamp for production
- Consider data archival for old readings

---

### predictions

Stores ML prediction results.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Prediction unique identifier |
| machine_id | UUID | FOREIGN KEY → machines.id, NOT NULL | Associated machine |
| prediction_time | TIMESTAMP | NOT NULL | When prediction was made |
| failure_probability | FLOAT | NOT NULL | Failure probability (0.0 - 1.0) |
| health_score | FLOAT | NOT NULL | Health score (0 - 100) |
| risk_level | VARCHAR(50) | NOT NULL | Risk level (LOW, MEDIUM, HIGH) |
| predicted_failure | BOOLEAN | NOT NULL | Is failure predicted |
| model_version | VARCHAR(100) | NOT NULL | ML model version used |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |

**Indexes**:
- `idx_predictions_machine` on `machine_id`
- `idx_predictions_time` on `prediction_time`
- `idx_predictions_risk` on `risk_level`
- Composite index on `(machine_id, prediction_time)`

**Relationships**:
- Many-to-one with `machines`

**Risk Level Values**:
- `LOW`: Failure probability < 0.3
- `MEDIUM`: Failure probability 0.3 - 0.7
- `HIGH`: Failure probability > 0.7

---

### maintenance_records

Stores maintenance activity logs.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Record unique identifier |
| machine_id | UUID | FOREIGN KEY → machines.id, NOT NULL | Associated machine |
| maintenance_date | DATE | NOT NULL | When maintenance was performed |
| maintenance_type | VARCHAR(50) | NOT NULL | Type of maintenance |
| description | TEXT | NOT NULL | Description of work performed |
| technician | VARCHAR(255) | NOT NULL | Technician name |
| cost | FLOAT | DEFAULT 0.0 | Maintenance cost |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |

**Indexes**:
- `idx_maintenance_machine` on `machine_id`
- `idx_maintenance_date` on `maintenance_date`
- `idx_maintenance_type` on `maintenance_type`

**Relationships**:
- Many-to-one with `machines`

**Maintenance Type Values**:
- `PREVENTIVE`: Scheduled maintenance to prevent failures
- `CORRECTIVE`: Repairs after failure occurs
- `INSPECTION`: Routine inspection
- `OVERHAUL`: Complete equipment overhaul

**Business Logic**:
- When corrective or overhaul maintenance is recorded, machine status is automatically reset to HEALTHY if it was WARNING or CRITICAL

---

## Database Initialization

### Initialization Script

The database is initialized using `database/init_db.py`:

```python
# Creates all tables
Base.metadata.create_all(bind=engine)

# Seeds demo users
# Seeds demo machines (optional)
# Seeds demo sensor data (optional)
```

### Running Initialization

```bash
cd database
python init_db.py
```

## Query Patterns

### Common Queries

#### Get Machine with Latest Sensor Reading
```sql
SELECT m.*, s.*
FROM machines m
LEFT JOIN sensor_readings s ON m.id = s.machine_id
WHERE m.id = $1
ORDER BY s.timestamp DESC
LIMIT 1;
```

#### Get Machine Health Summary
```sql
SELECT 
    m.id,
    m.machine_code,
    m.machine_name,
    m.status,
    (SELECT health_score FROM predictions 
     WHERE machine_id = m.id 
     ORDER BY prediction_time DESC 
     LIMIT 1) as latest_health_score,
    (SELECT failure_probability FROM predictions 
     WHERE machine_id = m.id 
     ORDER BY prediction_time DESC 
     LIMIT 1) as latest_failure_probability
FROM machines m;
```

#### Get High Risk Machines
```sql
SELECT m.*, p.*
FROM machines m
JOIN predictions p ON m.id = p.machine_id
WHERE p.risk_level = 'HIGH'
ORDER BY p.prediction_time DESC;
```

#### Get Maintenance Cost by Type
```sql
SELECT 
    maintenance_type,
    COUNT(*) as count,
    SUM(cost) as total_cost,
    AVG(cost) as avg_cost
FROM maintenance_records
GROUP BY maintenance_type;
```

## Performance Considerations

### Indexing Strategy
- Foreign keys are indexed for JOIN performance
- Timestamp columns are indexed for time-based queries
- Status/type columns are indexed for filtering
- Composite indexes support common query patterns

### Data Retention
- Sensor readings: High volume, consider archival after 1 year
- Predictions: Keep for trend analysis (6-12 months)
- Maintenance records: Keep indefinitely for compliance
- Users: Keep indefinitely

### Partitioning (Future Enhancement)
For production with high sensor data volume:
- Partition `sensor_readings` by timestamp (monthly partitions)
- Partition `predictions` by timestamp (monthly partitions)
- Consider separate database for historical data

## Backup Strategy

### Recommended Backup Strategy
1. **Daily Full Backups**: Complete database dump
2. **Point-in-Time Recovery**: WAL archiving (PostgreSQL feature)
3. **Off-site Storage**: Store backups in secure location
4. **Backup Testing**: Regular restore testing

### Backup Command
```bash
pg_dump -U postgres predictive_maintenance > backup_$(date +%Y%m%d).sql
```

### Restore Command
```bash
psql -U postgres predictive_maintenance < backup_20240101.sql
```

## Security

### Access Control
- Database credentials stored in environment variables
- Application uses least-privilege database user
- No direct database access from frontend

### Data Encryption
- Passwords hashed with bcrypt
- Consider encryption for sensitive fields (e.g., technician personal info)
- TLS for database connections in production

### Audit Logging (Future Enhancement)
- Track all INSERT/UPDATE/DELETE operations
- Log user who made changes
- Log timestamp of changes

## Migration Strategy

### Current Approach
- SQLAlchemy models define schema
- Alembic not currently used (schema managed via init_db.py)

### Recommended for Production
- Implement Alembic for version-controlled migrations
- Migration scripts for schema changes
- Rollback capability for failed migrations

## Monitoring

### Key Metrics to Monitor
- Database connection pool usage
- Query performance (slow query log)
- Table sizes (sensor_readings will grow fastest)
- Index usage statistics
- Deadlock occurrences

### PostgreSQL Tools
- `pg_stat_activity`: Monitor active connections
- `pg_stat_statements`: Query performance
- `pg_stat_user_tables`: Table access statistics

## Troubleshooting

### Common Issues

#### Slow Queries
- Check query execution plan with `EXPLAIN ANALYZE`
- Add missing indexes
- Consider query optimization

#### Connection Pool Exhaustion
- Increase pool size in SQLAlchemy configuration
- Check for connection leaks in application code
- Monitor connection lifecycle

#### Disk Space
- Sensor readings table grows fastest
- Implement data archival strategy
- Monitor disk usage regularly

## Future Enhancements

1. **Materialized Views**: Pre-compute common aggregations
2. **Triggers**: Auto-update machine status based on predictions
3. **Stored Procedures**: Complex business logic in database
4. **Read Replicas**: Offload read queries to replicas
5. **Connection Pooling**: PgBouncer for connection management
6. **Full-Text Search**: Search across descriptions and notes
7. **Time-Series Database**: Consider TimescaleDB for sensor data
