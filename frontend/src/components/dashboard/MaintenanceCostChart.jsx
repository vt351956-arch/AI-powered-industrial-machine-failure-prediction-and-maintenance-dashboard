import { Card } from '../ui/UIComponents';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export default function MaintenanceCostChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <div className="h-64 flex items-center justify-center">
          <p className="text-slate-500 text-sm">No maintenance cost data available</p>
        </div>
      </Card>
    );
  }

  const chartData = data.map(item => ({
    month: item.month,
    preventive: item.preventive_cost || item.preventiveCost,
    corrective: item.corrective_cost || item.correctiveCost,
    total: item.total_cost || item.totalCost,
  }));

  return (
    <Card>
      <h3 className="text-lg font-semibold text-white mb-4">Maintenance Cost Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis 
            dataKey="month"
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
          />
          <YAxis 
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            label={{ value: 'Cost ($)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
            }}
            itemStyle={{ color: '#e2e8f0' }}
            formatter={(value) => [`$${value.toFixed(2)}`, '']}
          />
          <Legend />
          <Bar dataKey="preventive" fill="#10b981" name="Preventive" radius={[4, 4, 0, 0]} />
          <Bar dataKey="corrective" fill="#f43f5e" name="Corrective" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
