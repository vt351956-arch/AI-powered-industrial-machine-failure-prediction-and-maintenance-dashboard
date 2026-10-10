import { Bell, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function TopBar({ title, subtitle, onRefresh, refreshing = false }) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800/80 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-xl">{title}</h1>
          {subtitle && <p className="text-slate-500 text-sm mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-3">
          {/* Demo Data Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-cyan-400 text-xs font-medium">Demo Mode</span>
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors text-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}

          <div className="w-8 h-8 rounded-full bg-brand-600/30 flex items-center justify-center">
            <span className="text-brand-400 font-bold text-sm">{user?.name?.[0]?.toUpperCase()}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
