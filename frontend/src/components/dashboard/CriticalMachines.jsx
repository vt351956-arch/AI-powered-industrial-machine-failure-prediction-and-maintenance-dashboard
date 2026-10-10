import { Card, StatusBadge, HealthScoreRing } from '../ui/UIComponents';
import { Link } from 'react-router-dom';

export default function CriticalMachines({ data }) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <div className="h-64 flex items-center justify-center">
          <p className="text-slate-500 text-sm">No critical machines</p>
        </div>
      </Card>
    );
  }

  const criticalMachines = Array.isArray(data) 
    ? data.filter(m => (m.status === 'CRITICAL' || m.risk_level === 'HIGH' || m.riskLevel === 'HIGH')).slice(0, 5)
    : [];

  if (criticalMachines.length === 0) {
    return (
      <Card>
        <div className="h-64 flex items-center justify-center">
          <p className="text-slate-500 text-sm">No critical machines at this time</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-white mb-4">Critical Machines</h3>
      <div className="space-y-3">
        {criticalMachines.map((machine) => (
          <div key={machine.id || machine.machine_id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <div className="flex items-center gap-4">
              <HealthScoreRing score={machine.health_score || machine.latest_health_score || 0} size={60} />
              <div>
                <p className="text-white font-medium">{machine.machine_name || machine.name}</p>
                <p className="text-slate-400 text-sm">{machine.machine_code || machine.code}</p>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={machine.status || 'UNKNOWN'} size="sm" />
                  <span className="text-slate-500 text-xs">
                    Risk: {((machine.failure_probability || machine.latest_failure_probability || 0) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
            <Link
              to={`/machines/${machine.id || machine.machine_id}`}
              className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-sm rounded-lg transition-colors"
            >
              View
            </Link>
          </div>
        ))}
      </div>
    </Card>
  );
}
