import { useState } from 'react';
import { Card } from '../ui/UIComponents';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const SENSOR_TYPES = [
  { key: 'temperature', label: 'Temperature (°C)', color: '#f97316', unit: '°C' },
  { key: 'vibration', label: 'Vibration (mm/s)', color: '#8b5cf6', unit: 'mm/s' },
  { key: 'pressure', label: 'Pressure (bar)', color: '#06b6d4', unit: 'bar' },
  { key: 'rpm', label: 'RPM', color: '#10b981', unit: 'RPM' },
  { key: 'power_consumption', label: 'Power (kW)', color: '#f59e0b', unit: 'kW' },
];

export default function SensorTrendChart({ data }) {
  const [selectedSensor, setSelectedSensor] = useState('temperature');

  if (!data || data.length === 0) {
    return (
      <Card>
        <div className="h-64 flex items-center justify-center">
          <p className="text-slate-500 text-sm">No sensor data available</p>
        </div>
      </Card>
    );
  }

  const sensorConfig = SENSOR_TYPES.find(s => s.key === selectedSensor) || SENSOR_TYPES[0];

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Sensor Trends</h3>
        <select
          value={selectedSensor}
          onChange={(e) => setSelectedSensor(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {SENSOR_TYPES.map(sensor => (
            <option key={sensor.key} value={sensor.key}>{sensor.label}</option>
          ))}
        </select>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis 
            dataKey="timestamp" 
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
          />
          <YAxis 
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            label={{ value: sensorConfig.unit, angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
            }}
            itemStyle={{ color: '#e2e8f0' }}
            formatter={(value) => [`${value.toFixed(2)} ${sensorConfig.unit}`, sensorConfig.label]}
          />
          <Line
            type="monotone"
            dataKey={selectedSensor}
            stroke={sensorConfig.color}
            strokeWidth={2}
            dot={{ fill: sensorConfig.color, r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
