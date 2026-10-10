"""
Reproducible Demo Data Seeding Script for Industry 4.0 Predictive Maintenance
Populates PostgreSQL with:
  - Standard User Roles (Admin, Engineer, Viewer)
  - 15 Industrial Machine Assets (Pumps, Compressors, CNCs, Turbines, Motors)
  - Chronological Sensor Readings with physics-grounded telemetry
  - Model Predictions and Health Scores
  - Maintenance Work Order History
"""

from datetime import date, datetime, timedelta, timezone
import os
import random
import sys
from pathlib import Path

# Add backend directory to Python path
sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np
from sqlalchemy.orm import Session

from app.config import settings
from app.database import Base, SessionLocal, check_db_connection, engine, init_db
from app.models.machine import Machine
from app.models.maintenance import MaintenanceRecord
from app.models.prediction import Prediction
from app.models.sensor import SensorReading
from app.models.user import User
from app.services.ml_service import ml_service
from app.utils.security import hash_password


def seed_database(random_seed: int = 42):
    print("=" * 70)
    print(" SEEDING INDUSTRY 4.0 PREDICTIVE MAINTENANCE DATABASE")
    print(" NOTE: Synthetic telemetry is generated for academic / benchmark purposes.")
    print("=" * 70)

    # 1. Verify Connectivity
    if not check_db_connection():
        print("\n[ERROR] Could not connect to PostgreSQL database.")
        print(f"Target URL: {settings.DATABASE_URL}")
        print("Please ensure PostgreSQL is running and the database exists before seeding.")
        sys.exit(1)

    # 2. Re-create / ensure tables exist
    print("\n[1/5] Ensuring relational schema tables exist...")
    init_db()

    db: Session = SessionLocal()
    np.random.seed(random_seed)
    random.seed(random_seed)

    try:
        # 3. Create Default User Accounts
        print("\n[2/5] Seeding standard role-based user accounts...")
        default_users = [
            {
                "name": "Dr. Marcus Vance",
                "email": "admin@smartplant.com",
                "password": "Admin123!",
                "role": "admin",
            },
            {
                "name": "Elena Rostova",
                "email": "engineer@smartplant.com",
                "password": "Engineer123!",
                "role": "engineer",
            },
            {
                "name": "Tariq Al-Mansoor",
                "email": "viewer@smartplant.com",
                "password": "Viewer123!",
                "role": "viewer",
            },
        ]

        created_users = {}
        for u in default_users:
            existing = db.query(User).filter(User.email == u["email"]).first()
            if not existing:
                user = User(
                    name=u["name"],
                    email=u["email"],
                    password_hash=hash_password(u["password"]),
                    role=u["role"],
                )
                db.add(user)
                db.flush()
                created_users[u["role"]] = user
                print(f"  + Created User [{u['role'].upper()}]: {u['email']} / {u['password']}")
            else:
                created_users[u["role"]] = existing
                print(f"  * Existing User [{u['role'].upper()}]: {u['email']}")

        admin_user_id = created_users["admin"].id

        # 4. Seed 15 Realistic Industrial Machines
        print("\n[3/5] Seeding 15 industrial machines across manufacturing plant sectors...")
        machine_definitions = [
            ("CNC-MILL-01", "CNC Milling Center Alpha", "CNC Machine", "Machining Bay 1", date(2022, 3, 15), "HEALTHY"),
            ("PUMP-CENT-02", "Centrifugal Chilled Water Pump", "Centrifugal Pump", "Utility Plant Sector A", date(2021, 6, 20), "HEALTHY"),
            ("COMP-SCREW-03", "Rotary Screw Air Compressor", "Rotary Compressor", "Compressor House", date(2020, 11, 10), "WARNING"),
            ("PUMP-FEED-04", "High-Pressure Boiler Feed Pump", "Boiler Feed Pump", "Boiler House", date(2023, 1, 5), "HEALTHY"),
            ("TURB-GAS-05", "Industrial Gas Turbine Generator", "Gas Turbine", "Power Generation Island", date(2019, 8, 14), "CRITICAL"),
            ("CONV-MTR-06", "Heavy Duty Conveyor Drive Motor", "Electric Induction Motor", "Packaging Line 3", date(2022, 9, 22), "HEALTHY"),
            ("PRESS-HYD-07", "Hydraulic Stamping Press 500T", "Hydraulic Press", "Stamping Bay 2", date(2020, 4, 18), "WARNING"),
            ("CNC-LTH-08", "High-Speed CNC Lathe Beta", "CNC Lathe", "Machining Bay 2", date(2023, 5, 30), "HEALTHY"),
            ("FAN-COOL-09", "Secondary Cooling Tower Fan", "Cooling Tower Fan", "Roof Deck North", date(2021, 12, 1), "HEALTHY"),
            ("MIX-SLUR-10", "Chemical Slurry Agitator Motor", "Agitator Motor", "Chemical Processing Wing", date(2022, 7, 19), "CRITICAL"),
            ("ROB-PNEU-11", "Robotic Arm Welding Unit", "Robotic System", "Automated Welding Cell 1", date(2023, 8, 12), "HEALTHY"),
            ("GEAR-EXT-12", "Planetary Extruder Drive Gearbox", "Planetary Gearbox", "Polymer Extrusion Hall", date(2020, 2, 28), "OFFLINE"),
            ("VAC-PUMP-13", "Liquid Ring Vacuum Pump", "Vacuum Pump", "Degassing Line 2", date(2022, 10, 14), "HEALTHY"),
            ("BLOW-EXH-14", "Main Industrial Exhaust Blower", "Centrifugal Blower", "Facility Filtration Deck", date(2021, 4, 9), "WARNING"),
            ("HOIST-MTR-15", "Overhead Crane Hoist Motor", "Wire Rope Hoist Motor", "Heavy Assembly Bay", date(2023, 2, 17), "HEALTHY"),
        ]

        saved_machines = []
        for code, name, m_type, loc, inst_date, initial_status in machine_definitions:
            m = db.query(Machine).filter(Machine.machine_code == code).first()
            if not m:
                m = Machine(
                    machine_code=code,
                    machine_name=name,
                    machine_type=m_type,
                    location=loc,
                    installation_date=inst_date,
                    status=initial_status,
                    created_by=admin_user_id,
                )
                db.add(m)
                db.flush()
                print(f"  + Machine created: {code} - {name} ({initial_status})")
            saved_machines.append((m, initial_status))

        # 5. Generate Chronological Telemetry & Predictions
        print("\n[4/5] Generating chronological sensor readings and predictive risk scores...")
        now = datetime.now(timezone.utc)

        for machine, status_target in saved_machines:
            # Determine telemetry baseline based on target health status
            if status_target == "CRITICAL":
                temp_center, temp_spread = 96.0, 5.0
                vib_center, vib_spread = 7.8, 1.2
                press_center, press_spread = 2.1, 0.4
                rpm_center, rpm_spread = 1680.0, 45.0
                power_center, power_spread = 32.0, 3.0
                base_hours = 9200.0
            elif status_target == "WARNING":
                temp_center, temp_spread = 78.0, 4.0
                vib_center, vib_spread = 4.6, 0.7
                press_center, press_spread = 3.6, 0.3
                rpm_center, rpm_spread = 1740.0, 30.0
                power_center, power_spread = 21.0, 2.0
                base_hours = 6500.0
            elif status_target == "OFFLINE":
                temp_center, temp_spread = 25.0, 1.0
                vib_center, vib_spread = 0.2, 0.05
                press_center, press_spread = 1.0, 0.1
                rpm_center, rpm_spread = 0.0, 0.0
                power_center, power_spread = 0.5, 0.1
                base_hours = 11500.0
            else:  # HEALTHY
                temp_center, temp_spread = 64.0, 3.0
                vib_center, vib_spread = 2.1, 0.3
                press_center, press_spread = 4.2, 0.25
                rpm_center, rpm_spread = 1785.0, 20.0
                power_center, power_spread = 14.2, 1.2
                base_hours = 3100.0

            # Generate 40 telemetry readings across the past 10 days
            n_readings = 40
            for step in range(n_readings, 0, -1):
                timestamp = now - timedelta(hours=step * 6)
                hours_accumulated = base_hours + ((n_readings - step) * 6.0)

                temp_val = float(np.random.normal(temp_center, temp_spread))
                vib_val = float(np.random.normal(vib_center, vib_spread))
                press_val = float(np.random.normal(press_center, press_spread))
                rpm_val = float(np.random.normal(rpm_center, rpm_spread))
                power_val = float(np.random.normal(power_center, power_spread))

                # Bounds clipping
                temp_val = max(20.0, min(140.0, round(temp_val, 2)))
                vib_val = max(0.1, min(25.0, round(vib_val, 2)))
                press_val = max(0.5, min(15.0, round(press_val, 2)))
                rpm_val = max(0.0, min(6000.0, round(rpm_val, 1)))
                power_val = max(0.0, min(100.0, round(power_val, 2)))
                hours_accumulated = round(hours_accumulated, 1)

                # ML inference for anomaly detection & prediction
                pred_eval = ml_service.predict(
                    temperature=temp_val,
                    vibration=vib_val,
                    pressure=press_val,
                    rpm=rpm_val if rpm_val > 0 else 1750.0,
                    power_consumption=power_val if power_val > 0 else 14.0,
                    operating_hours=hours_accumulated,
                )

                reading = SensorReading(
                    machine_id=machine.id,
                    timestamp=timestamp,
                    temperature=temp_val,
                    vibration=vib_val,
                    pressure=press_val,
                    rpm=rpm_val,
                    power_consumption=power_val,
                    operating_hours=hours_accumulated,
                    is_anomaly=pred_eval["anomaly_detected"],
                    anomaly_score=pred_eval["anomaly_score"],
                )
                db.add(reading)

                # Save periodic prediction checkpoints every 4th reading
                if step % 4 == 0:
                    pred_record = Prediction(
                        machine_id=machine.id,
                        prediction_time=timestamp,
                        failure_probability=pred_eval["failure_probability"],
                        health_score=pred_eval["health_score"],
                        risk_level=pred_eval["risk_level"],
                        predicted_failure=pred_eval["predicted_failure"],
                        model_version=ml_service.model_version,
                    )
                    db.add(pred_record)

        # 6. Seed Maintenance Records
        print("\n[5/5] Generating maintenance work orders and cost histories...")
        maintenance_types = ["PREVENTIVE", "CORRECTIVE", "INSPECTION", "OVERHAUL"]
        technicians = [
            "Alex Mercer, Sr. Vibration Analyst",
            "Carlos Santana, Mechanical Technician",
            "Devon Price, Lubrication Specialist",
            "Farah Khan, Electrical Engineer",
            "George Taylor, Reliability Tech",
        ]
        maintenance_descriptions = [
            "Replaced dynamic seal and greased spherical roller bearings.",
            "Dynamic laser shaft alignment and balance correction on drive couplings.",
            "Replaced suction filter elements and flushed hydraulic reservoir.",
            "Ultrasonic motor stator inspection and insulation resistance testing.",
            "Full teardown inspection and clearance calibration.",
            "Replaced worn impeller and checked mechanical casing wear rings.",
            "Vibration damper replacement and torqued foundation bolts.",
        ]

        for machine, _ in saved_machines:
            # 2 to 4 maintenance records per machine
            num_records = random.randint(2, 4)
            for k in range(num_records):
                days_ago = random.randint(15, 360)
                maint_date = date.today() - timedelta(days=days_ago)
                m_type = random.choice(maintenance_types)
                cost = (
                    random.uniform(250.0, 950.0)
                    if m_type in ["PREVENTIVE", "INSPECTION"]
                    else random.uniform(1200.0, 4800.0)
                )

                record = MaintenanceRecord(
                    machine_id=machine.id,
                    maintenance_date=maint_date,
                    maintenance_type=m_type,
                    description=random.choice(maintenance_descriptions),
                    technician=random.choice(technicians),
                    cost=round(cost, 2),
                )
                db.add(record)

        db.commit()
        print("\n" + "=" * 70)
        print(" [DATABASE SEEDING COMPLETE]")
        print("  - Users seeded:       3 (Admin, Engineer, Viewer)")
        print("  - Machines seeded:    15 (Diverse industrial fleet)")
        print("  - Sensor readings:    ~600 historical telemetry points")
        print("  - Model predictions:  ~150 evaluated risk snapshots")
        print("  - Maintenance logs:   ~45 work orders")
        print("=" * 70)
        print(" Demo Login Credentials:")
        print("  * Admin:     admin@smartplant.com     / Admin123!")
        print("  * Engineer:  engineer@smartplant.com  / Engineer123!")
        print("  * Viewer:    viewer@smartplant.com    / Viewer123!")
        print("=" * 70)

    except Exception as e:
        db.rollback()
        print(f"\n[CRITICAL ERROR DURING SEEDING] {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
