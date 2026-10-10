import { Card, StatusBadge } from '../ui/UIComponents';
import { Link } from 'react-router-dom';

export default function RecentPredictions({ data }) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <div className="h-64 flex items-center justify-center">
          <p className="text-slate-500 text-sm">No prediction data available</p>
        </div>
      </Card>
    );
  }

  const predictions = Array.isArray(data) ? data.slice(0, 5) : [];

  return (
    <Card>
      <h3 className="text-lg font-semibold text-white mb-4">Recent Predictions</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-2 px-3 text-slate-400 font-medium">Machine</th>
              <th className="text-left py-2 px-3 text-slate-400 font-medium">Time</th>
              <th className="text-left py-2 px-3 text-slate-400 font-medium">Failure Prob</th>
              <th className="text-left py-2 px-3 text-slate-400 font-medium">Health Score</th>
              <th className="text-left py-2 px-3 text-slate-400 font-medium">Risk Level</th>
            </tr>
          </thead>
          <tbody>
            {predictions.map((pred, index) => (
              <tr key={index} className="border-b border-slate-800 hover:bg-slate-800/50">
                <td className="py-2 px-3 text-slate-300">{pred.machine_code || pred.machine_id || 'N/A'}</td>
                <td className="py-2 px-3 text-slate-400">
                  {new Date(pred.prediction_time || pred.timestamp).toLocaleString()}
                </td>
                <td className="py-2 px-3 text-slate-300">
                  {((pred.failure_probability || 0) * 100).toFixed(1)}%
                </td>
                <td className="py-2 px-3 text-slate-300">
                  {pred.health_score?.toFixed(1) || 'N/A'}
                </td>
                <td className="py-2 px-3">
                  <StatusBadge status={pred.risk_level || 'LOW'} size="sm" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
