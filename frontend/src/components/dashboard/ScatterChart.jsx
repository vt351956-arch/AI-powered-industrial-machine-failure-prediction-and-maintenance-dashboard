import { Card, StatusBadge } from '../ui/UIComponents';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
} from 'recharts';

export default function ScatterChartComponent({ data }) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <div className="h-64 flex items-center justify-center">
          <p className="text-slate-500 text-sm">No scatter data available</p>
        </div>
      </Card>
    );
  }

  const getRiskColor = (riskLevel) => {
    switch (riskLevel?.toUpperCase()) {
      case 'HIGH': return '#f43f5e';
      case 'MEDIUM': return '#f59e0b';
      case 'LOW': return '#10b981';
      default: return '#64748b';
    }
  };

  return (
    <Card>
      <h3 className="text-lg font-semibold text-white mb-4">Temperature vs Vibration</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis 
            type="number" 
            dataKey="temperature" 
            name="Temperature"
            unit="°C"
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            label={{ value: 'Temperature (°C)', position: 'insideBottom', fill: '#94a3b8', fontSize: 11 }}
          />
          <YAxis 
            type="number" 
            dataKey="vibration" 
            name="Vibration"
            unit="mm/s"
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            label={{ value: 'Vibration (mm/s)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }}
          />
          <ZAxis type="number" dataKey="health_score" range={[50, 400]} name="Health Score" />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
            }}
            itemStyle={{ color: '#e2e8f0' }}
            formatter={(value, name) => {
              if (name === 'health_score') return [value.toFixed(1), 'Health Score'];
              if (name === 'temperature') return [value.toFixed(1) + '°C', 'Temperature'];
              if (name === 'vibration') return [value.toFixed(2) + ' mm/s', 'Vibration'];
              return [value, name];
            }}
            labelFormatter={(label) => {
              const point = data[label];
              return point ? `${point.machine_code} - ${point.machine_name}` : '';
            }}
          />
          <Scatter dataKey="vibration" fill="#06b6d4" shape={(props) => {
            const { cx, cy, payload } = props;
            const color = getRiskColor(payload.risk_level);
            return (
              <circle cx={cx} cy={cy} r={8} fill={color} fillOpacity={0.7} stroke={color} strokeWidth={2} />
            );
          }} />
        </ScatterChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span>Low Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span>Medium Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-500" />
          <span>High Risk</span>
        </div>
      </div>
    </Card>
  );
}
