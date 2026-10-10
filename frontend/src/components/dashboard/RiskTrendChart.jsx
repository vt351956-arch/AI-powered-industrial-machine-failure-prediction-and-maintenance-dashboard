import { Card } from '../ui/UIComponents';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export default function RiskTrendChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <div className="h-64 flex items-center justify-center">
          <p className="text-slate-500 text-sm">No risk trend data available</p>
        </div>
      </Card>
    );
  }

  const chartData = data.map(point => ({
    timestamp: point.timestamp,
    healthy: point.healthy_count,
    warning: point.warning_count,
    critical: point.critical_count,
  }));

  return (
    <Card>
      <h3 className="text-lg font-semibold text-white mb-4">Failure Risk Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
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
            label={{ value: 'Machine Count', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
            }}
            itemStyle={{ color: '#e2e8f0' }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="healthy"
            stackId="1"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.6}
            name="Healthy"
          />
          <Area
            type="monotone"
            dataKey="warning"
            stackId="1"
            stroke="#f59e0b"
            fill="#f59e0b"
            fillOpacity={0.6}
            name="Warning"
          />
          <Area
            type="monotone"
            dataKey="critical"
            stackId="1"
            stroke="#f43f5e"
            fill="#f43f5e"
            fillOpacity={0.6}
            name="Critical"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
