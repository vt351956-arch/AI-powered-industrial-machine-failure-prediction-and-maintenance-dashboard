import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button, Input } from '../../components/ui/UIComponents';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }
    const result = await login(email.trim(), password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:flex-1 flex-col justify-between p-12 bg-gradient-to-br from-slate-900 via-slate-950 to-brand-950 border-r border-slate-800/60 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-brand-900/50">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-tight">PredictMaint</p>
            <p className="text-slate-500 text-xs">Industry 4.0 Platform</p>
          </div>
        </div>
        <div className="relative">
          <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
            AI-Powered<br />Predictive Maintenance
          </h2>
          <p className="text-slate-400 text-base mb-8 max-w-sm">
            Monitor your industrial equipment in real-time. Detect anomalies and predict failures before they cause costly downtime.
          </p>
          <div className="grid grid-cols-2 gap-4 max-w-sm">
            {[
              { label: 'Random Forest', desc: 'Failure Classification' },
              { label: 'Isolation Forest', desc: 'Anomaly Detection' },
              { label: 'Real-time KPIs', desc: 'Fleet Dashboard' },
              { label: 'Health Scoring', desc: '0–100 Index' },
            ].map(f => (
              <div key={f.label} className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/50">
                <p className="text-brand-400 font-semibold text-sm">{f.label}</p>
                <p className="text-slate-500 text-xs mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-slate-600 text-xs">
          ⚠ Academic / Portfolio Prototype. Trained on synthetic benchmark telemetry. Not for industrial certification.
        </p>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <p className="text-white font-bold">PredictMaint</p>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-slate-400 text-sm mb-8">Sign in to your monitoring dashboard</p>

          {/* Demo credentials notice */}
          <div className="mb-6 p-4 rounded-xl bg-cyan-950/50 border border-cyan-800/50">
            <p className="text-cyan-400 text-xs font-semibold mb-2">🔑 Demo Credentials (after seeding)</p>
            <div className="space-y-1">
              <p className="text-cyan-300/70 text-xs">Admin: admin@smartplant.com / Admin123!</p>
              <p className="text-cyan-300/70 text-xs">Engineer: engineer@smartplant.com / Engineer123!</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-950/50 border border-rose-800/50">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <p className="text-rose-300 text-sm">{error}</p>
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder="you@smartplant.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full bg-slate-800/60 border border-slate-700 text-slate-100 rounded-lg px-3 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full justify-center py-2.5 mt-2">
              Sign In
            </Button>
          </form>

          <p className="text-slate-500 text-sm text-center mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
