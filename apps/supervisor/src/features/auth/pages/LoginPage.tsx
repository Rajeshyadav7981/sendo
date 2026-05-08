import { type FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../auth.api';
import { useAuthStore } from '@store/auth.store';

export default function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setSession = useAuthStore((s) => s.setSession);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError('');
    try {
      await authApi.loginEmployee(password);
      setSession(password);
      navigate('/dashboard', { replace: true });
    } catch {
      setError('Server unreachable or password rejected by API.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sup-login-wrap">
      <div className="sup-login-card">
        <div className="sup-login-header">
          <div className="sup-login-icon">🚛</div>
          <h1 className="sup-login-title">Supervisor</h1>
          <p className="sup-login-sub">
            Employee tracker password only — same as backend <code>COMMON_EMP_PASSWORD</code> (not
            admin).
          </p>
        </div>

        <form className="sup-login-form" onSubmit={onSubmit}>
          <label className="sup-field">
            Password
            <input
              type="password"
              autoComplete="current-password"
              className="sup-input"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error ? (
            <p className="sup-error" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading || !password}
            className="sup-btn sup-btn-amber sup-btn-flex2"
            style={{ width: '100%' }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
