// Reusable Card component
export function Card({ children, className = '', gradient = false }) {
  return (
    <div className={`glass-card p-6 ${gradient ? 'kpi-gradient-border' : ''} ${className}`}>
      {children}
    </div>
  );
}

// Status Badge
const STATUS_COLORS = {
  HEALTHY: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  WARNING: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  CRITICAL: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  OFFLINE: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  LOW: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  MEDIUM: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  HIGH: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
};

export function StatusBadge({ status, size = 'sm' }) {
  const color = STATUS_COLORS[status?.toUpperCase()] || 'bg-slate-500/15 text-slate-400 border-slate-500/30';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border font-semibold uppercase tracking-wide ${color} ${textSize}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

// Loading Spinner
export function Spinner({ size = 'md' }) {
  const sz = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-10 h-10' : 'w-7 h-7';
  return (
    <svg className={`animate-spin ${sz} text-brand-500`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// Full-page loading state
export function PageLoader({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
      <Spinner size="lg" />
      <p className="text-slate-400 text-sm">{message}</p>
    </div>
  );
}

// Empty state
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      {Icon && <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center mb-2"><Icon className="w-8 h-8 text-slate-500" /></div>}
      <h3 className="text-slate-300 font-semibold text-lg">{title}</h3>
      {description && <p className="text-slate-500 text-sm max-w-xs">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// Error state
export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <div className="w-14 h-14 rounded-full bg-rose-500/10 flex items-center justify-center">
        <span className="text-2xl">⚠️</span>
      </div>
      <p className="text-rose-400 font-semibold">Something went wrong</p>
      <p className="text-slate-500 text-sm max-w-xs">{message}</p>
      {onRetry && <button onClick={onRetry} className="btn-secondary text-sm px-4 py-2 rounded-lg mt-1">Retry</button>}
    </div>
  );
}

// Primary Button
export function Button({ children, onClick, type = 'button', variant = 'primary', loading = false, disabled = false, className = '', icon: Icon }) {
  const base = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950';
  const variants = {
    primary: 'bg-brand-600 hover:bg-brand-500 text-white focus:ring-brand-500 shadow-lg shadow-brand-900/30',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 focus:ring-slate-600',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white focus:ring-rose-500',
    ghost: 'hover:bg-slate-800 text-slate-400 hover:text-slate-200 focus:ring-slate-600',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} className={`${base} ${variants[variant]} ${className}`}>
      {loading && <Spinner size="sm" />}
      {Icon && !loading && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
}

// Input field
export function Input({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-slate-300">{label}</label>}
      <input
        className={`bg-slate-800/60 border ${error ? 'border-rose-500' : 'border-slate-700'} text-slate-100 rounded-lg px-3 py-2.5 text-sm
          placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all ${className}`}
        {...props}
      />
      {error && <p className="text-rose-400 text-xs">{error}</p>}
    </div>
  );
}

// Select field
export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-slate-300">{label}</label>}
      <select
        className={`bg-slate-800/60 border ${error ? 'border-rose-500' : 'border-slate-700'} text-slate-100 rounded-lg px-3 py-2.5 text-sm
          focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-rose-400 text-xs">{error}</p>}
    </div>
  );
}

// Health Score Ring
export function HealthScoreRing({ score, size = 100 }) {
  const normalized = Math.max(0, Math.min(100, score || 0));
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const dash = (normalized / 100) * circumference;
  const color = normalized >= 70 ? '#10b981' : normalized >= 30 ? '#f59e0b' : '#f43f5e';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 100 100" className="-rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#1e293b" strokeWidth="10" />
        <circle
          cx="50" cy="50" r={radius} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-bold text-white" style={{ fontSize: size * 0.22 }}>{Math.round(normalized)}</span>
        <span className="text-slate-400" style={{ fontSize: size * 0.11 }}>Health</span>
      </div>
    </div>
  );
}
