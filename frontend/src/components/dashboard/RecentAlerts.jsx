import { Card, StatusBadge } from '../ui/UIComponents';
import { AlertTriangle } from 'lucide-react';

export default function RecentAlerts({ data }) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <div className="h-64 flex items-center justify-center">
          <p className="text-slate-500 text-sm">No alerts at this time</p>
        </div>
      </Card>
    );
  }

  const alerts = Array.isArray(data) ? data.slice(0, 5) : [];

  const getSeverityColor = (severity) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL': return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'HIGH': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'MEDIUM': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'LOW': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  return (
    <Card>
      <h3 className="text-lg font-semibold text-white mb-4">Recent Alerts</h3>
      <div className="space-y-3">
        {alerts.map((alert, index) => (
          <div key={index} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${getSeverityColor(alert.severity || 'LOW')}`}>
                  {alert.severity || 'LOW'}
                </span>
                <span className="text-slate-400 text-xs">
                  {new Date(alert.timestamp || alert.created_at).toLocaleString()}
                </span>
              </div>
              <p className="text-white text-sm font-medium truncate">{alert.message || alert.alert_type || 'Alert'}</p>
              {alert.machine_code && (
                <p className="text-slate-400 text-xs mt-0.5">{alert.machine_code}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
