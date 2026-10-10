"""
Dataset Generator for Industrial Sensor Telemetry & Machine Failure Classification
Synthesizes physics-grounded telemetry for rotary machinery with realistic degradation modes.
"""

import numpy as np
import pandas as pd


def generate_synthetic_maintenance_dataset(n_samples: int = 6000, random_seed: int = 42) -> pd.DataFrame:
    """
    Generate synthetic sensor readings with physical relationships reflecting
    normal conditions, thermal wear, mechanical unbalance, and hydraulic stress.
    
    Returns:
        pd.DataFrame containing:
        - temperature (°C)
        - vibration (mm/s)
        - pressure (bar)
        - rpm (revolutions/min)
        - power_consumption (kW)
        - operating_hours (hrs)
        - failure (0 or 1)
        - failure_mode (str describing mechanical state)
    """
    rng = np.random.RandomState(random_seed)

    # Base operating parameters
    operating_hours = rng.uniform(50, 12000, size=n_samples)
    
    # Baseline normal distributions
    base_rpm = rng.normal(loc=1780.0, scale=40.0, size=n_samples)
    base_temp = rng.normal(loc=65.0, scale=4.5, size=n_samples)
    base_vib = rng.normal(loc=2.2, scale=0.45, size=n_samples)
    base_pressure = rng.normal(loc=4.2, scale=0.35, size=n_samples)
    base_power = rng.normal(loc=14.5, scale=1.8, size=n_samples)

    # Gradual wear effect from accumulated operating hours
    wear_factor = (operating_hours / 12000.0) ** 1.5
    temp = base_temp + (wear_factor * 8.0)
    vib = base_vib + (wear_factor * 1.2)
    pressure = base_pressure - (wear_factor * 0.4)
    power = base_power + (wear_factor * 2.5)
    rpm = base_rpm - (wear_factor * 30.0)

    # Initialize failure labels
    failure = np.zeros(n_samples, dtype=int)
    failure_mode = np.array(["NORMAL"] * n_samples, dtype=object)

    # Inject realistic failure scenarios (~18% of the dataset)
    # Mode 1: Bearing & Mechanical Unbalance (Vibration > 5.5, Temp rising)
    bearing_mask = rng.rand(n_samples) < 0.06
    vib[bearing_mask] += rng.uniform(3.5, 7.5, size=np.sum(bearing_mask))
    temp[bearing_mask] += rng.uniform(12.0, 26.0, size=np.sum(bearing_mask))
    failure[bearing_mask] = 1
    failure_mode[bearing_mask] = "BEARING_WEAR"

    # Mode 2: Overheating & Lubrication Breakdown (Temp > 88°C, Power rising)
    overheat_mask = (rng.rand(n_samples) < 0.05) & (failure == 0)
    temp[overheat_mask] += rng.uniform(22.0, 38.0, size=np.sum(overheat_mask))
    power[overheat_mask] += rng.uniform(5.0, 14.0, size=np.sum(overheat_mask))
    failure[overheat_mask] = 1
    failure_mode[overheat_mask] = "THERMAL_OVERLOAD"

    # Mode 3: Hydraulic Pressure Cavitation / Line Blockage
    hydraulic_mask = (rng.rand(n_samples) < 0.04) & (failure == 0)
    # 50% severe drop (cavitation/leak), 50% severe surge (clog/valve jam)
    is_drop = rng.rand(np.sum(hydraulic_mask)) < 0.5
    hydraulic_indices = np.where(hydraulic_mask)[0]
    pressure[hydraulic_indices[is_drop]] -= rng.uniform(1.8, 2.6, size=np.sum(is_drop))
    pressure[hydraulic_indices[~is_drop]] += rng.uniform(2.5, 4.0, size=np.sum(~is_drop))
    vib[hydraulic_mask] += rng.uniform(2.0, 4.5, size=np.sum(hydraulic_mask))
    failure[hydraulic_mask] = 1
    failure_mode[hydraulic_mask] = "HYDRAULIC_ANOMALY"

    # Mode 4: Motor Overload & Electrical Stator Saturation (Power > 28kW, RPM drop)
    motor_mask = (rng.rand(n_samples) < 0.04) & (failure == 0)
    power[motor_mask] += rng.uniform(11.0, 20.0, size=np.sum(motor_mask))
    rpm[motor_mask] -= rng.uniform(120.0, 350.0, size=np.sum(motor_mask))
    temp[motor_mask] += rng.uniform(10.0, 20.0, size=np.sum(motor_mask))
    failure[motor_mask] = 1
    failure_mode[motor_mask] = "ELECTRICAL_OVERLOAD"

    # Mode 5: Old Age / End-of-Life Fatigue
    fatigue_mask = (operating_hours > 9500) & (rng.rand(n_samples) < 0.35) & (failure == 0)
    vib[fatigue_mask] += rng.uniform(2.0, 3.8, size=np.sum(fatigue_mask))
    temp[fatigue_mask] += rng.uniform(8.0, 16.0, size=np.sum(fatigue_mask))
    power[fatigue_mask] += rng.uniform(4.0, 8.0, size=np.sum(fatigue_mask))
    failure[fatigue_mask] = 1
    failure_mode[fatigue_mask] = "FATIGUE_END_OF_LIFE"

    # Introduce occasional low-noise outliers to test robustness
    noise_idx = rng.choice(n_samples, size=int(0.01 * n_samples), replace=False)
    temp[noise_idx] += rng.normal(0, 3.0, size=len(noise_idx))
    vib[noise_idx] += rng.normal(0, 0.4, size=len(noise_idx))

    # Constrain values to physically plausible boundaries
    temp = np.clip(np.round(temp, 2), 20.0, 140.0)
    vib = np.clip(np.round(vib, 2), 0.2, 25.0)
    pressure = np.clip(np.round(pressure, 2), 0.5, 12.0)
    rpm = np.clip(np.round(rpm, 1), 600.0, 3600.0)
    power = np.clip(np.round(power, 2), 2.0, 60.0)
    operating_hours = np.round(operating_hours, 1)

    df = pd.DataFrame({
        "temperature": temp,
        "vibration": vib,
        "pressure": pressure,
        "rpm": rpm,
        "power_consumption": power,
        "operating_hours": operating_hours,
        "failure": failure,
        "failure_mode": failure_mode
    })

    return df


if __name__ == "__main__":
    df = generate_synthetic_maintenance_dataset(1000)
    print(f"Generated {len(df)} samples.")
    print("Failure distribution:\n", df["failure"].value_counts(normalize=True))
    print("\nSample records:\n", df.head())
