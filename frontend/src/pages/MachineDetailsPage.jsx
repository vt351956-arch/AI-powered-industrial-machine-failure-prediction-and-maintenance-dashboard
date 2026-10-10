import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageLoader, ErrorState, EmptyState, Card, StatusBadge, HealthScoreRing, Button, Input, Select } from '../components/ui/UIComponents';
import { ArrowLeft, Edit, Trash2, TrendingUp, Wrench, Thermometer, Activity, Gauge, Zap, Clock, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { machineService, sensorService, predictionService, maintenanceService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function MachineDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [machine, setMachine] = useState(null);
  const [sensorHistory, setSensorHistory] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [selectedSensorTab, setSelectedSensorTab] = useState('temperature');
  const [predicting, setPredicting] = useState(false);
  const [showAddMaintenanceModal, setShowAddMaintenanceModal] = useState(false);
  const [maintenanceFormData, setMaintenanceFormData] = useState({
    machine_id: id,
    maintenance_date: '',
    maintenance_type: 'PREVENTIVE',
    description: '',
    technician: '',
    cost: 0,
  });
  const [maintenanceFormError, setMaintenanceFormError] = useState('');
  const [submittingMaintenance, setSubmittingMaintenance] = useState(false);

  useEffect(() => {
    loadMachineData();
  }, [id]);

  const loadMachineData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [machineRes, sensorRes, predRes, maintRes] = await Promise.all([
        machineService.get(id).catch(err => {
          console.error('Machine API error:', err);
          return null;
        }),
        sensorService.list({ machine_id: id, limit: 50 }).catch(err => {
          console.error('Sensor API error:', err);
          return { data: [] };
        }),
        predictionService.list({ machine_id: id, limit: 20 }).catch(err => {
          console.error('Prediction API error:', err);
          return { data: [] };
        }),
        maintenanceService.list({ machine_id: id, limit: 20 }).catch(err => {
          console.error('Maintenance API error:', err);
          return { data: [] };
        }),
      ]);

      if (machineRes) {
        setMachine(machineRes.data);
      }
      if (sensorRes) {
        setSensorHistory(sensorRes.data || []);
      }
      if (predRes) {
        setPredictions(predRes.data || []);
      }
      if (maintRes) {
        setMaintenance(maintRes.data || []);
      }

      if (!machineRes) {
        setError('Machine not found');
      }
    } catch (err) {
      console.error('Failed to load machine data:', err);
      setError('Failed to load machine data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handlePredict = async () => {
    setPredicting(true);
    try {
      const latestSensor = sensorHistory[0];
      if (!latestSensor) {
        alert('No sensor data available for prediction');
        return;
      }

      await predictionService.predict({
        machine_id: id,
        temperature: latestSensor.temperature,
        vibration: latestSensor.vibration,
        pressure: latestSensor.pressure,
        rpm: latestSensor.rpm,
        power_consumption: latestSensor.power_consumption,
        operating_hours: latestSensor.operating_hours,
      });

      loadMachineData();
    } catch (err) {
      console.error('Prediction failed:', err);
      alert('Failed to run prediction');
    } finally {
      setPredicting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${machine?.machine_name}? This action cannot be undone.`)) {
      return;
    }

    try {
      await machineService.delete(id);
      navigate('/machines');
    } catch (err) {
      alert('Failed to delete machine');
    }
  };

  const handleAddMaintenance = async (e) => {
    e.preventDefault();
    setMaintenanceFormError('');
    setSubmittingMaintenance(true);

    try {
      await maintenanceService.create(maintenanceFormData);
      setShowAddMaintenanceModal(false);
      setMaintenanceFormData({
        machine_id: id,
        maintenance_date: '',
        maintenance_type: 'PREVENTIVE',
        description: '',
        technician: '',
        cost: 0,
      });
      loadMachineData();
    } catch (err) {
      setMaintenanceFormError(err.response?.data?.detail || 'Failed to create maintenance record');
    } finally {
      setSubmittingMaintenance(false);
    }
  };

  const canEdit = user?.role === 'admin' || user?.role === 'engineer';
  const canDelete = user?.role === 'admin';

  const sensorConfig = {
    temperature: { label: 'Temperature (°C)', color: '#f97316', unit: '°C' },
    vibration: { label: 'Vibration (mm/s)', color: '#8b5cf6', unit: 'mm/s' },
    pressure: { label: 'Pressure (bar)', color: '#06b6d4', unit: 'bar' },
    rpm: { label: 'RPM', color: '#10b981', unit: 'RPM' },
    power_consumption: { label: 'Power (kW)', color: '#f59e0b', unit: 'kW' },
  };

  if (loading) {
    return (
      <div className="p-6">
        <PageLoader message="Loading machine details..." />
      </div>
    );
  }

  if (error || !machine) {
    return (
      <div className="p-6">
        <ErrorState message={error || 'Machine not found'} onRetry={() => navigate('/machines')} />
      </div>
    );
  }

  const latestSensor = machine.latest_sensor_reading;
  const sensorChartData = sensorHistory.map(s => ({
    timestamp: new Date(s.timestamp).toLocaleTimeString(),
    value: s[selectedSensorTab],
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/machines')} icon={ArrowLeft}>
            Back to Machines
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">{machine.machine_name}</h1>
            <p className="text-slate-400 text-sm">{machine.machine_code} • {machine.machine_type}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handlePredict} loading={predicting} icon={TrendingUp}>
            Run Prediction
          </Button>
          {canEdit && (
            <Button variant="secondary" onClick={() => setShowAddMaintenanceModal(true)} icon={Wrench}>
              Add Maintenance
            </Button>
          )}
          {canEdit && (
            <Button variant="secondary" onClick={() => navigate(`/machines/${id}/edit`)} icon={Edit}>
              Edit
            </Button>
          )}
          {canDelete && (
            <Button variant="danger" onClick={handleDelete} icon={Trash2}>
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Machine Info */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-slate-500 text-xs mb-1">Location</p>
            <p className="text-slate-300 font-medium">{machine.location}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs mb-1">Status</p>
            <StatusBadge status={machine.status} />
          </div>
          <div>
            <p className="text-slate-500 text-xs mb-1">Installation Date</p>
            <p className="text-slate-300 font-medium">{new Date(machine.installation_date).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs mb-1">Operating Hours</p>
            <p className="text-slate-300 font-medium">{machine.total_operating_hours?.toFixed(1) || '0'} hrs</p>
          </div>
        </div>
      </Card>

      {/* Health Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card gradient>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-2">Health Score</p>
              <HealthScoreRing score={machine.latest_health_score || 100} size={120} />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-white">{(machine.latest_health_score || 100).toFixed(1)}</p>
              <p className="text-slate-400 text-xs">out of 100</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-rose-500/10 flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-rose-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Failure Probability</p>
              <p className="text-2xl font-bold text-white">
                {((machine.latest_failure_probability || 0) * 100).toFixed(1)}%
              </p>
              <StatusBadge status={machine.latest_risk_level || 'LOW'} size="sm" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-brand-500/10 flex items-center justify-center">
              <Activity className="w-8 h-8 text-brand-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Predictions</p>
              <p className="text-2xl font-bold text-white">{machine.total_predictions || 0}</p>
              <p className="text-slate-500 text-xs">total predictions</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Latest Sensor Readings */}
      {latestSensor ? (
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Latest Sensor Readings</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Thermometer className="w-4 h-4 text-orange-400" />
                <p className="text-slate-400 text-xs">Temperature</p>
              </div>
              <p className="text-xl font-bold text-white">{latestSensor.temperature.toFixed(1)}°C</p>
              <p className="text-slate-500 text-xs">{new Date(latestSensor.timestamp).toLocaleString()}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-purple-400" />
                <p className="text-slate-400 text-xs">Vibration</p>
              </div>
              <p className="text-xl font-bold text-white">{latestSensor.vibration.toFixed(2)} mm/s</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Gauge className="w-4 h-4 text-cyan-400" />
                <p className="text-slate-400 text-xs">Pressure</p>
              </div>
              <p className="text-xl font-bold text-white">{latestSensor.pressure.toFixed(2)} bar</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <p className="text-slate-400 text-xs">RPM</p>
              </div>
              <p className="text-xl font-bold text-white">{latestSensor.rpm.toFixed(0)}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <p className="text-slate-400 text-xs">Power</p>
              </div>
              <p className="text-xl font-bold text-white">{latestSensor.power_consumption.toFixed(2)} kW</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <p className="text-slate-400 text-xs">Operating Hours</p>
              </div>
              <p className="text-xl font-bold text-white">{latestSensor.operating_hours.toFixed(1)} hrs</p>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <EmptyState
            icon={Thermometer}
            title="No Sensor Data"
            description="No sensor readings available for this machine yet."
          />
        </Card>
      )}

      {/* Sensor Trend Chart */}
      {sensorHistory.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Sensor Trends</h3>
            <div className="flex gap-2">
              {Object.entries(sensorConfig).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setSelectedSensorTab(key)}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    selectedSensorTab === key
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {config.label}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={sensorChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="timestamp" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                }}
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={sensorConfig[selectedSensorTab].color}
                strokeWidth={2}
                dot={{ fill: sensorConfig[selectedSensorTab].color, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Prediction History */}
      <Card>
        <h3 className="text-lg font-semibold text-white mb-4">Prediction History</h3>
        {predictions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 px-3 text-slate-400 font-medium">Time</th>
                  <th className="text-left py-2 px-3 text-slate-400 font-medium">Health Score</th>
                  <th className="text-left py-2 px-3 text-slate-400 font-medium">Failure Prob</th>
                  <th className="text-left py-2 px-3 text-slate-400 font-medium">Risk Level</th>
                  <th className="text-left py-2 px-3 text-slate-400 font-medium">Predicted Failure</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((pred, index) => (
                  <tr key={index} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="py-2 px-3 text-slate-300">
                      {new Date(pred.prediction_time).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-slate-300">{pred.health_score?.toFixed(1)}</td>
                    <td className="py-2 px-3 text-slate-300">
                      {((pred.failure_probability || 0) * 100).toFixed(1)}%
                    </td>
                    <td className="py-2 px-3">
                      <StatusBadge status={pred.risk_level || 'LOW'} size="sm" />
                    </td>
                    <td className="py-2 px-3 text-slate-300">
                      {pred.predicted_failure ? 'Yes' : 'No'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={TrendingUp}
            title="No Predictions"
            description="No prediction history available for this machine."
          />
        )}
      </Card>

      {/* Maintenance History */}
      <Card>
        <h3 className="text-lg font-semibold text-white mb-4">Maintenance History</h3>
        {maintenance.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 px-3 text-slate-400 font-medium">Date</th>
                  <th className="text-left py-2 px-3 text-slate-400 font-medium">Type</th>
                  <th className="text-left py-2 px-3 text-slate-400 font-medium">Description</th>
                  <th className="text-left py-2 px-3 text-slate-400 font-medium">Technician</th>
                  <th className="text-left py-2 px-3 text-slate-400 font-medium">Cost</th>
                </tr>
              </thead>
              <tbody>
                {maintenance.map((record, index) => (
                  <tr key={index} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="py-2 px-3 text-slate-300">
                      {new Date(record.maintenance_date).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-3 text-slate-300">{record.maintenance_type}</td>
                    <td className="py-2 px-3 text-slate-400">{record.description}</td>
                    <td className="py-2 px-3 text-slate-300">{record.technician}</td>
                    <td className="py-2 px-3 text-slate-300">${record.cost?.toFixed(2) || '0.00'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Wrench}
            title="No Maintenance Records"
            description="No maintenance history available for this machine."
          />
        )}
      </Card>

      {/* Add Maintenance Modal */}
      {showAddMaintenanceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">Add Maintenance Record</h2>
            <form onSubmit={handleAddMaintenance} className="space-y-4">
              {maintenanceFormError && (
                <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800/50 text-rose-300 text-sm">
                  {maintenanceFormError}
                </div>
              )}
              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <p className="text-slate-400 text-xs mb-1">Machine</p>
                <p className="text-white font-medium">{machine?.machine_code} - {machine?.machine_name}</p>
              </div>
              <Input
                label="Maintenance Date"
                type="date"
                value={maintenanceFormData.maintenance_date}
                onChange={(e) => setMaintenanceFormData({ ...maintenanceFormData, maintenance_date: e.target.value })}
                required
              />
              <Select
                label="Maintenance Type"
                value={maintenanceFormData.maintenance_type}
                onChange={(e) => setMaintenanceFormData({ ...maintenanceFormData, maintenance_type: e.target.value })}
              >
                <option value="PREVENTIVE">Preventive</option>
                <option value="CORRECTIVE">Corrective</option>
                <option value="INSPECTION">Inspection</option>
                <option value="OVERHAUL">Overhaul</option>
              </Select>
              <Input
                label="Description"
                value={maintenanceFormData.description}
                onChange={(e) => setMaintenanceFormData({ ...maintenanceFormData, description: e.target.value })}
                placeholder="Describe the maintenance work performed"
                required
              />
              <Input
                label="Technician"
                value={maintenanceFormData.technician}
                onChange={(e) => setMaintenanceFormData({ ...maintenanceFormData, technician: e.target.value })}
                placeholder="Technician name"
                required
              />
              <Input
                label="Cost ($)"
                type="number"
                step="0.01"
                min="0"
                value={maintenanceFormData.cost}
                onChange={(e) => setMaintenanceFormData({ ...maintenanceFormData, cost: parseFloat(e.target.value) || 0 })}
              />
              <div className="flex gap-3 pt-2">
                <Button type="submit" loading={submittingMaintenance} className="flex-1">
                  Create Record
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowAddMaintenanceModal(false)}
                  disabled={submittingMaintenance}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
