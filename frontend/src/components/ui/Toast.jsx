import { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';

// Toast notification system
let toastId = 0;
const listeners = new Set();

function createToastEvent(type, message, duration = 4000) {
  const id = ++toastId;
  listeners.forEach(fn => fn({ id, type, message, duration }));
}

export const toast = {
  success: (msg, d) => createToastEvent('success', msg, d),
  error: (msg, d) => createToastEvent('error', msg, d),
  warning: (msg, d) => createToastEvent('warning', msg, d),
  info: (msg, d) => createToastEvent('info', msg, d),
};

const ICONS = {
  success: <CheckCircle className="w-5 h-5 text-emerald-400" />,
  error: <XCircle className="w-5 h-5 text-rose-400" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-400" />,
  info: <Info className="w-5 h-5 text-cyan-400" />,
};

const COLORS = {
  success: 'border-emerald-500/40 bg-emerald-950/80',
  error: 'border-rose-500/40 bg-rose-950/80',
  warning: 'border-amber-500/40 bg-amber-950/80',
  info: 'border-cyan-500/40 bg-cyan-950/80',
};

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (toast) => {
      setToasts(prev => [...prev, toast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      }, toast.duration || 4000);
    };
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-2xl ${COLORS[t.type]} animate-in slide-in-from-right duration-300`}
        >
          <div className="mt-0.5 shrink-0">{ICONS[t.type]}</div>
          <p className="flex-1 text-sm text-slate-200 leading-relaxed">{t.message}</p>
          <button onClick={() => remove(t.id)} className="text-slate-500 hover:text-slate-300 transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
