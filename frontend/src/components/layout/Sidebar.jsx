import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Cpu, Activity, BarChart3, AlertTriangle,
  Wrench, User, LogOut, Menu, X, ChevronRight, Zap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/machines', icon: Cpu, label: 'Machines' },
  { to: '/predictions', icon: Zap, label: 'Predictions' },
  { to: '/alerts', icon: AlertTriangle, label: 'Alerts' },
  { to: '/maintenance', icon: Wrench, label: 'Maintenance' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'} shrink-0`} style={{ minHeight: '100vh' }}>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-800 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center shrink-0 shadow-lg shadow-brand-900/40">
          <Activity className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-white font-bold text-sm leading-tight">PredictMaint</p>
            <p className="text-slate-500 text-xs">Industry 4.0</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 flex flex-col gap-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group relative
              ${isActive
                ? 'bg-brand-600/20 text-brand-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              } ${collapsed ? 'justify-center' : ''}`
            }
            title={collapsed ? label : undefined}
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-brand-500" />}
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                {!collapsed && <span className="text-sm">{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="border-t border-slate-800 p-3">
        {!collapsed && user && (
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-brand-600/30 flex items-center justify-center shrink-0">
              <span className="text-brand-400 font-bold text-sm">{user.name?.[0]?.toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <p className="text-slate-200 text-sm font-medium truncate">{user.name}</p>
              <p className="text-slate-500 text-xs capitalize">{user.role}</p>
            </div>
          </div>
        )}
        <div className={`flex ${collapsed ? 'flex-col' : 'flex-row'} gap-1`}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center gap-2 p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors w-full"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            {!collapsed && <span className="text-xs">Collapse</span>}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors w-full"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span className="text-xs">Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
