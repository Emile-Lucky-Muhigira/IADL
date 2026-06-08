'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { getDashboardPath } from '@/lib/utils';
import { Eye, EyeOff, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

/* ──────────────────────────────────────────────────────────────────────────
   DEMO ACCOUNTS — for testing only.
   To hide in production: set env var NEXT_PUBLIC_DEMO_MODE=false,
   or delete the DEMO_ACCOUNTS array and the "DEMO ACCOUNTS" block below.
   ────────────────────────────────────────────────────────────────────────── */
const DEMO_ACCOUNTS: { role: string; email: string; password: string }[] = [
  { role: 'Super Admin',          email: 'superadmin@iadl.ac.ke',               password: 'Admin@1234!' },
  { role: 'ADL Admin',            email: 'admin@iadl.ac.ke',                    password: 'Admin@1234!' },
  { role: 'Gatekeeper (Nairobi)', email: 'gatekeeper@nairobi.adlschools.ac.ke', password: 'Pass@1234!'  },
  { role: 'Trainer (Nairobi)',    email: 'trainer@nairobi.adlschools.ac.ke',    password: 'Pass@1234!'  },
  { role: 'Student (Nairobi)',    email: 'student@nairobi.adlschools.ac.ke',    password: 'Pass@1234!'  },
  { role: 'Parent (Nairobi)',     email: 'parent@nairobi.adlschools.ac.ke',     password: 'Pass@1234!'  },
  { role: 'Accountant (Nairobi)', email: 'finance@nairobi.adlschools.ac.ke',    password: 'Pass@1234!'  },
  { role: 'Auditor (Nairobi)',    email: 'auditor@nairobi.adlschools.ac.ke',    password: 'Pass@1234!'  },
  { role: 'Gatekeeper (Mombasa)', email: 'gatekeeper@mombasa.adlschools.ac.ke', password: 'Pass@1234!'  },
  { role: 'Student (Mombasa)',    email: 'amina@mombasa.adlschools.ac.ke',      password: 'Pass@1234!'  },
];

const SHOW_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE !== 'false';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const router = useRouter();

  function pickDemo(acc: { email: string; password: string }) {
    setEmail(acc.email);
    setPassword(acc.password);
    setError('');
    setShowDemo(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', { email, password, redirect: false });

    if (result?.error) {
      setError('Invalid email or password. Please check your credentials.');
      setLoading(false);
      return;
    }

    const res     = await fetch('/api/auth/session');
    const session = await res.json();
    const role    = session?.user?.role;
    router.push(role ? getDashboardPath(role) : '/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-900 dark:bg-gray-950 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-700/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8">

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-600 rounded-2xl mb-4 shadow-lg">
              <span className="text-white text-xl font-bold select-none">AC</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">IADL Center EMIS</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Education Management System — Angaza Center
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                className="input"
                placeholder="you@adlschools.ac.ke"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
              ) : 'Sign In'}
            </button>
          </form>

          {/* ── DEMO ACCOUNTS (testing only — remove for production) ───────── */}
          {SHOW_DEMO && (
            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
              <button
                type="button"
                onClick={() => setShowDemo((v) => !v)}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 hover:text-brand-600 transition-colors"
              >
                {showDemo ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                Demo Accounts
              </button>

              {showDemo && (
                <div className="mt-3 space-y-1.5 max-h-64 overflow-y-auto">
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
                    Click an account to auto-fill, then press Sign In.
                  </p>
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => pickDemo(acc)}
                      className="w-full text-left rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-colors"
                    >
                      <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">{acc.role}</span>
                      <span className="block text-xs text-gray-500 dark:text-gray-400 truncate">{acc.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* ── end demo accounts ─────────────────────────────────────────── */}

          <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
            Angaza Center &copy; {new Date().getFullYear()} — Confidential
          </p>
        </div>
      </div>
    </div>
  );
}
