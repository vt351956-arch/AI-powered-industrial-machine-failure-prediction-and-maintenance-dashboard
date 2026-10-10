import { Card } from '../ui/UIComponents';

export default function DashboardKpiCard({ title, value, icon: Icon, subtitle, color = 'brand' }) {
  const colorClasses = {
    brand: 'text-brand-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    rose: 'text-rose-400',
    cyan: 'text-cyan-400',
  };

  const bgClasses = {
    brand: 'bg-brand-500/10',
    emerald: 'bg-emerald-500/10',
    amber: 'bg-amber-500/10',
    rose: 'bg-rose-500/10',
    cyan: 'bg-cyan-500/10',
  };

  return (
    <Card gradient>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-white mb-1">{value}</p>
          {subtitle && <p className="text-slate-500 text-xs">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl ${bgClasses[color]} flex items-center justify-center shrink-0`}>
          <Icon className={`w-6 h-6 ${colorClasses[color]}`} />
        </div>
      </div>
    </Card>
  );
}
