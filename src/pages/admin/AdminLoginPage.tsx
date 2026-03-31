import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/auth/AdminAuthContext';

export default function AdminLoginPage() {
  const { login, isAuthenticated } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('change_this_password');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    navigate('/admin', { replace: true });
  }

  const from = (location.state as { from?: string } | undefined)?.from ?? '/admin';

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError((err as Error).message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-kaleo-sand px-4">
      <div className="w-full max-w-md rounded-3xl border border-kaleo-earth/10 bg-white p-6 shadow-lg">
        <h1 className="font-display text-3xl text-kaleo-earth">Admin Login</h1>
        <p className="mt-2 font-body text-sm text-kaleo-earth/60">
          Sign in with your admin credentials.
        </p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1 block font-body text-sm text-kaleo-earth">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-kaleo-earth/20 px-3 py-2"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block font-body text-sm text-kaleo-earth">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-kaleo-earth/20 px-3 py-2"
              required
            />
          </label>
          {error ? <p className="font-body text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-kaleo-terracotta px-4 py-3 font-body text-xs uppercase tracking-wider text-white hover:bg-kaleo-earth disabled:opacity-60"
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

