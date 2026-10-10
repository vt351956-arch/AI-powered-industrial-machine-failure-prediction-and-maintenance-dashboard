
import { useEffect, useState } from 'react';
import { User, Mail, Shield, Calendar, RefreshCw } from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Try to read the logged-in user from common auth storage keys.
    const possibleKeys = ['user', 'currentUser', 'authUser', 'profile'];
    let foundUser = null;

    for (const key of possibleKeys) {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          const parsed = JSON.parse(value);
          if (parsed && typeof parsed === 'object') {
            foundUser = parsed.user || parsed;
            break;
          }
        }
      } catch {
        // Ignore storage values that are not JSON.
      }
    }

    setUser(foundUser);
  }, []);

  const name =
    user?.full_name ||
    user?.fullName ||
    user?.name ||
    user?.username ||
    'SmartPlant User';

  const email = user?.email || 'Email not available';
  const role = user?.role || user?.user_role || 'User';
  const userId = user?.id || user?.user_id || 'Not available';

  return (
    <div className="min-h-full space-y-6 p-6 text-slate-100">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="mt-1 text-sm text-slate-400">
          View your SmartPlant account information.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-300">
            <User size={36} />
          </div>

          <div>
            <h2 className="text-xl font-semibold">{name}</h2>
            <p className="mt-1 text-sm text-slate-400">{email}</p>
            <span className="mt-3 inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium uppercase text-cyan-300">
              {String(role).replaceAll('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-3">
            <Mail className="text-cyan-400" size={22} />
            <div>
              <p className="text-sm text-slate-400">Email address</p>
              <p className="mt-1 break-all font-medium">{email}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-3">
            <Shield className="text-cyan-400" size={22} />
            <div>
              <p className="text-sm text-slate-400">Account role</p>
              <p className="mt-1 font-medium">{role}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-3">
            <Calendar className="text-cyan-400" size={22} />
            <div>
              <p className="text-sm text-slate-400">User ID</p>
              <p className="mt-1 break-all font-medium">{userId}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-3">
            <RefreshCw className="text-cyan-400" size={22} />
            <div>
              <p className="text-sm text-slate-400">Profile status</p>
              <p className="mt-1 font-medium text-emerald-400">
                Page loaded successfully
              </p>
            </div>
          </div>
        </div>
      </div>

      {!user && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200">
          Profile page is working, but saved user details were not found in
          local storage. Some fields may show fallback values.
        </div>
      )}
    </div>
  );
}
