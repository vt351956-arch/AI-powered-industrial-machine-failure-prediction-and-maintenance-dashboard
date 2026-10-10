
import { useState, useEffect, useCallback } from 'react';
import {
  PageLoader,
  ErrorState,
  EmptyState,
  Card,
  StatusBadge,
  HealthScoreRing,
  Button,
  Select,
} from '../components/ui/UIComponents';
import {
  Brain,
  Thermometer,
  Activity,
  Gauge,
  Zap,
  Clock,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Info,
} from 'lucide-react';
import {
  machineService,
  sensorService,
  predictionService,
} from '../services/api';

function getPayload(response) {
  let data = response?.data ?? response;

  if (
    data &&
    !Array.isArray(data) &&
    typeof data === 'object' &&
    data.data !== undefined
  ) {
    data = data.data;
  }

  return data;
}

function getList(response) {
  const data = getPayload(response);

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.machines)) return data.machines;
  if (Array.isArray(data?.predictions)) return data.predictions;

  return [];
}

function getNumericValue(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatNumber(value, digits = 1) {
  const number = getNumericValue(value);
  return number === null ? 'N/A' : number.toFixed(digits);
}

function getErrorMessage(error) {
  const detail = error?.response?.data?.detail;

  if (typeof detail === 'string') return detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item.msg || JSON.stringify(item))
      .join('; ');
  }

  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'An unexpected error occurred.'
  );
}

export default function PredictionsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [machines, setMachines] = useState([]);
  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [latestSensor, setLatestSensor] = useState(null);
  const [loadingSensor, setLoadingSensor] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [predictionHistory, setPredictionHistory] = useState([]);
  const [modelInfo, setModelInfo] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [predictionError, setPredictionError] = useState('');
  const [notice, setNotice] = useState('');

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [machinesResponse, modelResponse] = await Promise.all([
        machineService.list({ limit: 100 }),
        predictionService.getModelInfo().catch((err) => {
          console.error('Model info request failed:', err);
          return null;
        }),
      ]);

      const machineList = getList(machinesResponse);
      setMachines(machineList);
      setModelInfo(modelResponse ? getPayload(modelResponse) : null);

      if (machineList.length === 0) {
        setError('No machines were returned by the backend.');
      } else {
        setSelectedMachineId((currentId) => {
          const stillExists = machineList.some(
            (machine) => String(machine.id) === String(currentId)
          );
          return stillExists ? currentId : String(machineList[0].id);
        });
      }
    } catch (err) {
      console.error('Failed to load prediction center:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMachineData = useCallback(async (machineId) => {
    if (!machineId) return;

    setLoadingSensor(true);
    setLatestSensor(null);
    setPredictionHistory([]);
    setPredictionError('');
    setNotice('');

    try {
      const [sensorResponse, historyResponse] = await Promise.all([
        sensorService.getLatest(machineId),
        predictionService
          .list({ machine_id: machineId, limit: 20 })
          .catch((err) => {
            console.error('Prediction history request failed:', err);
            return null;
          }),
      ]);

      const sensorData = getPayload(sensorResponse);

      if (Array.isArray(sensorData)) {
        setLatestSensor(sensorData[0] ?? null);
      } else if (sensorData && typeof sensorData === 'object') {
        setLatestSensor(sensorData);
      } else {
        setLatestSensor(null);
      }

      if (historyResponse) {
        setPredictionHistory(getList(historyResponse));
      }
    } catch (err) {
      console.error('Failed to load machine sensor data:', err);
      setLatestSensor(null);
      setPredictionError(
        `Could not load sensor readings: ${getErrorMessage(err)}`
      );
    } finally {
      setLoadingSensor(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (selectedMachineId) {
      setPredictionResult(null);
      loadMachineData(selectedMachineId);
    } else {
      setLatestSensor(null);
      setPredictionHistory([]);
      setPredictionResult(null);
    }
  }, [selectedMachineId, loadMachineData]);

  const handlePredict = async () => {
    console.log('[Prediction] Button handler started.');

    if (predicting) return;

    setPredictionError('');
    setNotice('');

    if (!selectedMachineId) {
      setPredictionError('Please select a machine first.');
      return;
    }

    if (!latestSensor) {
      setPredictionError('No sensor readings are available for this machine.');
      return;
    }

    const temperature = getNumericValue(latestSensor.temperature);
    const vibration = getNumericValue(latestSensor.vibration);
    const pressure = getNumericValue(latestSensor.pressure);
    const rpm = getNumericValue(latestSensor.rpm);
    const powerConsumption = getNumericValue(
      latestSensor.power_consumption
    );
    const operatingHours = getNumericValue(latestSensor.operating_hours);

    const missingFields = [];

    if (temperature === null) missingFields.push('temperature');
    if (vibration === null) missingFields.push('vibration');
    if (pressure === null) missingFields.push('pressure');
    if (rpm === null) missingFields.push('rpm');
    if (powerConsumption === null) {
      missingFields.push('power_consumption');
    }
    if (operatingHours === null) {
      missingFields.push('operating_hours');
    }

    if (missingFields.length > 0) {
      setPredictionError(
        `Missing or invalid sensor fields: ${missingFields.join(', ')}.`
      );
      return;
    }

    const payload = {
      machine_id: selectedMachineId,
      temperature,
      vibration,
      pressure,
      rpm,
      power_consumption: powerConsumption,
      operating_hours: operatingHours,
    };

    console.log('[Prediction] Request payload:', payload);

    setPredicting(true);
    setPredictionResult(null);

    try {
      // Uses the existing project API service and endpoint.
      const response = await predictionService.predict(payload);
      const result = getPayload(response);

      console.log('[Prediction] API response:', result);

      if (!result || typeof result !== 'object' || Array.isArray(result)) {
        throw new Error('The prediction API returned an unexpected response.');
      }

      setPredictionResult(result);
      setNotice('Prediction completed successfully.');

      // Refresh history only. Do not call loadMachineData here,
      // because it clears sensor state and prediction result.
      try {
        const historyResponse = await predictionService.list({
          machine_id: selectedMachineId,
          limit: 20,
        });

        setPredictionHistory(getList(historyResponse));
      } catch (historyError) {
        console.error(
          '[Prediction] History refresh failed:',
          historyError
        );
      }
    } catch (err) {
      console.error('[Prediction] Request failed:', err);
      setPredictionError(getErrorMessage(err));
    } finally {
      setPredicting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <PageLoader message="Loading prediction center..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorState message={error} onRetry={loadInitialData} />
      </div>
    );
  }

  const selectedMachine = machines.find(
    (machine) => String(machine.id) === String(selectedMachineId)
  );

  const failureProbability = getNumericValue(
    predictionResult?.failure_probability
  );

  const probabilityPercent =
    failureProbability === null
      ? null
      : failureProbability <= 1
        ? failureProbability * 100
        : failureProbability;

  const healthScore = getNumericValue(predictionResult?.health_score);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            AI Prediction Center
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Estimate machine health and failure risk using sensor readings.
          </p>
        </div>

        <Button
          variant="secondary"
          icon={RefreshCw}
          onClick={loadInitialData}
        >
          Refresh
        </Button>
      </div>

      <Card>
        <label className="mb-2 block text-sm font-medium text-slate-300">
          Select Machine
        </label>

        <Select
          value={selectedMachineId}
          onChange={(value) => {
            const nextValue = value?.target
              ? value.target.value
              : value;
            setSelectedMachineId(String(nextValue ?? ''));
          }}
        >
          <option value="">-- Select a machine --</option>
          {machines.map((machine) => (
            <option key={machine.id} value={machine.id}>
              {machine.machine_code || 'Machine'} -{' '}
              {machine.machine_name || machine.name || 'Unnamed'}
            </option>
          ))}
        </Select>

        {selectedMachine && (
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <p className="text-slate-400">
              Location:{' '}
              <span className="text-slate-200">
                {selectedMachine.location || 'Not specified'}
              </span>
            </p>
            <p className="text-slate-400">
              Status:{' '}
              <StatusBadge status={selectedMachine.status || 'UNKNOWN'} />
            </p>
          </div>
        )}
      </Card>

      {selectedMachineId && (
        <div className="flex flex-wrap gap-2 text-sm">
          <StepBadge label="1. Machine Selected" done={Boolean(selectedMachine)} />
          <StepBadge label="2. Sensor Data" done={Boolean(latestSensor)} />
          <StepBadge label="3. Prediction Result" done={Boolean(predictionResult)} />
        </div>
      )}

      {selectedMachineId && (
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-white">
            Current Sensor Readings
          </h3>

          {loadingSensor ? (
            <p className="py-6 text-slate-400">Loading sensor data...</p>
          ) : latestSensor ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
              <SensorCard icon={Thermometer} label="Temperature" value={formatNumber(latestSensor.temperature)} unit="°C" color="text-orange-400" />
              <SensorCard icon={Activity} label="Vibration" value={formatNumber(latestSensor.vibration, 2)} unit="mm/s" color="text-purple-400" />
              <SensorCard icon={Gauge} label="Pressure" value={formatNumber(latestSensor.pressure, 2)} unit="bar" color="text-cyan-400" />
              <SensorCard icon={Clock} label="RPM" value={formatNumber(latestSensor.rpm, 0)} unit="" color="text-emerald-400" />
              <SensorCard icon={Zap} label="Power" value={formatNumber(latestSensor.power_consumption, 2)} unit="kW" color="text-amber-400" />
              <SensorCard icon={Clock} label="Operating Hours" value={formatNumber(latestSensor.operating_hours)} unit="hrs" color="text-slate-400" />
            </div>
          ) : (
            <EmptyState
              icon={Thermometer}
              title="No Sensor Data"
              description="No sensor readings are available for this machine."
            />
          )}
        </Card>
      )}

      {selectedMachineId && (
        <Card>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-lg font-semibold text-white">
                Run AI Prediction
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Analyze current readings to estimate failure risk.
              </p>
            </div>

            <Button
              type="button"
              icon={Brain}
              loading={predicting}
              disabled={!latestSensor || loadingSensor || predicting}
              onClick={handlePredict}
              className="px-6 py-3"
            >
              {predicting ? 'Running Prediction...' : 'Run AI Prediction'}
            </Button>
          </div>

          {predictionError && (
            <div role="alert" className="mt-4 rounded-lg border border-rose-800/50 bg-rose-950/50 p-3 text-sm text-rose-300">
              {predictionError}
            </div>
          )}

          {notice && (
            <div role="status" className="mt-4 rounded-lg border border-emerald-800/50 bg-emerald-950/40 p-3 text-sm text-emerald-300">
              {notice}
            </div>
          )}
        </Card>
      )}

      {predictionResult && (
        <Card gradient>
          <div className="mb-4 flex items-center gap-2">
            <Brain className="h-5 w-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">
              Prediction Result
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="flex flex-col items-center justify-center">
              <HealthScoreRing
                score={healthScore ?? 0}
                size={140}
              />
              <p className="mt-2 text-sm text-slate-400">Health Score</p>
              <p className="text-3xl font-bold text-white">
                {formatNumber(predictionResult.health_score)}
              </p>
            </div>

            <div className="flex flex-col items-center justify-center">
              <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-cyan-500 bg-cyan-500/10">
                <span className="text-3xl font-bold text-white">
                  {probabilityPercent === null
                    ? 'N/A'
                    : `${Math.max(0, Math.min(100, probabilityPercent)).toFixed(1)}%`}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-400">
                Failure Probability
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <p className="mb-2 text-sm text-slate-400">Risk Level</p>
                <StatusBadge status={predictionResult.risk_level || 'UNKNOWN'} />
              </div>

              <div>
                <p className="mb-2 text-sm text-slate-400">
                  Predicted Failure
                </p>
                <div className="flex items-center gap-2 text-slate-200">
                  {predictionResult.predicted_failure ? (
                    <AlertTriangle className="h-5 w-5 text-rose-400" />
                  ) : (
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                  )}
                  <span className="font-semibold">
                    {predictionResult.predicted_failure
                      ? 'Failure Predicted'
                      : 'No Failure Predicted'}
                  </span>
                </div>
              </div>

              {predictionResult.anomaly_detected && (
                <p className="rounded border border-purple-500/30 bg-purple-500/10 p-2 text-sm text-purple-300">
                  Anomaly detected
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap justify-between gap-2 border-t border-slate-700/50 pt-4 text-xs text-slate-500">
            <span>
              Model: {predictionResult.model_version || 'Not specified'}
            </span>
            <span>
              {predictionResult.prediction_time
                ? new Date(predictionResult.prediction_time).toLocaleString()
                : ''}
            </span>
          </div>
        </Card>
      )}

      {modelInfo && (
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Info className="h-5 w-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">
              Model Information
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2 lg:grid-cols-3">
            <InfoItem label="Status" value={modelInfo.status} />
            <InfoItem label="Architecture" value={modelInfo.model_architecture} />
            <InfoItem label="Model Version" value={modelInfo.model_version} />
            {modelInfo.metrics && (
              <>
                <InfoItem label="Accuracy (Synthetic Dataset)" value={
                  getNumericValue(modelInfo.metrics.accuracy) === null
                    ? 'N/A'
                    : `${formatNumber(Number(modelInfo.metrics.accuracy) * 100, 2)}%`
                } />
                <InfoItem label="F1 Score" value={formatNumber(modelInfo.metrics.f1_score, 3)} />
                <InfoItem label="ROC AUC" value={formatNumber(modelInfo.metrics.roc_auc, 3)} />
              </>
            )}
          </div>

          {modelInfo.training_data_notice && (
            <p className="mt-4 rounded border border-slate-700/50 bg-slate-800/50 p-3 text-xs text-slate-400">
              {modelInfo.training_data_notice}
            </p>
          )}
        </Card>
      )}

      {selectedMachineId && (
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-white">
            Prediction History
          </h3>

          {predictionHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-left text-slate-400">
                    <th className="px-3 py-2">Time</th>
                    <th className="px-3 py-2">Health Score</th>
                    <th className="px-3 py-2">Failure Probability</th>
                    <th className="px-3 py-2">Risk Level</th>
                    <th className="px-3 py-2">Predicted Failure</th>
                    <th className="px-3 py-2">Model Version</th>
                  </tr>
                </thead>
                <tbody>
                  {predictionHistory.map((item, index) => {
                    const probability = getNumericValue(item.failure_probability);
                    const percent = probability === null
                      ? null
                      : probability <= 1
                        ? probability * 100
                        : probability;

                    return (
                      <tr
                        key={item.id || `${item.prediction_time || 'prediction'}-${index}`}
                        className="border-b border-slate-800"
                      >
                        <td className="px-3 py-2 text-slate-300">
                          {item.prediction_time
                            ? new Date(item.prediction_time).toLocaleString()
                            : 'N/A'}
                        </td>
                        <td className="px-3 py-2 text-slate-300">
                          {formatNumber(item.health_score)}
                        </td>
                        <td className="px-3 py-2 text-slate-300">
                          {percent === null ? 'N/A' : `${percent.toFixed(1)}%`}
                        </td>
                        <td className="px-3 py-2">
                          <StatusBadge status={item.risk_level || 'UNKNOWN'} size="sm" />
                        </td>
                        <td className="px-3 py-2 text-slate-300">
                          {item.predicted_failure ? 'Yes' : 'No'}
                        </td>
                        <td className="px-3 py-2 text-slate-400">
                          {item.model_version || 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={Brain}
              title="No Predictions Yet"
              description="Successful predictions will appear here."
            />
          )}
        </Card>
      )}
    </div>
  );
}

function StepBadge({ label, done }) {
  return (
    <div className={`rounded-lg border px-3 py-1.5 ${
      done
        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
        : 'border-slate-700 bg-slate-800 text-slate-400'
    }`}>
      {label}
    </div>
  );
}

function SensorCard({ icon: Icon, label, value, unit, color }) {
  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
      <div className="mb-2 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <p className="text-xs text-slate-400">{label}</p>
      </div>
      <p className="text-xl font-bold text-white">
        {value}{value !== 'N/A' ? unit : ''}
      </p>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="mb-1 text-xs text-slate-500">{label}</p>
      <p className="font-medium text-slate-300">
        {value === null || value === undefined || value === ''
          ? 'N/A'
          : String(value)}
      </p>
    </div>
  );
}
