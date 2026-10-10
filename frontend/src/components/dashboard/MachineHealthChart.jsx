import { Card, StatusBadge } from '../ui/UIComponents';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export default function MachineHealthChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <div className="h-64 flex items-center justify-center">
          <p className="text-slate-500 text-sm">No machine comparison data available</p>
        </div>
      </Card>
    );
  }

  const getBarColor = (healthScore) => {
    if (healthScore >= 70) return '#10b981';
    if (healthScore >= 40) return '#f59e0b';
    return '#f43f5e';
  };

  const chartData = data.map(machine => ({
    code: machine.machine_code.length > 10 ? machine.machine_code.substring(0, 10) + '...' : machine.machine_code,
    fullCode: machine.machine_code,
    name: machine.machine_name,
    healthScore: machine.healthScore || machine.health_score,
    riskLevel: machine.riskLevel || machine.risk_level,
    status: machine.status,
  }));

  return (
    <Card>
      <h3 className="text-lg font-semibold text-white mb-4">Machine Health Comparison</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="horizontal">
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis 
            type="number"
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            domain={[0, 100]}
            label={{ value: 'Health Score', position: 'insideBottom', fill: '#94a3b8', fontSize: 11 }}
          />
          <YAxis 
            type="category"
            dataKey="code"
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            width={100}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
            }}
            itemStyle={{ color: '#e2e8f0' }}
            formatter={(value, name) => {
              if (name === 'healthScore') return [value.toFixed(1), 'Health Score'];
              return [value, name];
            }}
            labelFormatter={(label) => {
              const item = chartData.find(d => d.code === label);
              return item ? `${item.fullCode} - ${item.name}` : label;
            }}
          />
          <Bar dataKey="healthScore" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.healthScore)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
