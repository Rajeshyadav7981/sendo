import { type FormEvent, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useResetPassword } from '../auth.hooks';
import { toastError } from '@shared/lib/toast';

export function ResetPasswordPage(): JSX.Element {
  const [params] = useSearchParams();
  const email = params.get('email') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const reset = useResetPassword();

  const onSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (password !== confirm) {
      toastError('Passwords do not match');
      return;
    }
    reset.mutate({ email, password });
  };

  return (
    <div className="flex h-screen items-center justify-center bg-sendo-page">
      <div className="w-[90%] max-w-[400px] rounded-[10px] bg-white p-6 shadow-[0_4px_6px_rgba(0,0,0,0.1)]">
        <h2 className="mb-4 text-center text-xl font-semibold">Reset Password</h2>
        <form className="flex flex-col gap-3" onSubmit={onSubmit}>
          <p className="text-sm text-gray-600">Resetting password for {email}</p>
          <input
            required
            minLength={8}
            type="password"
            placeholder="New password (min 8 chars)"
            className="sendo-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            required
            minLength={8}
            type="password"
            placeholder="Confirm password"
            className="sendo-input"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <button type="submit" disabled={reset.isPending} className="sendo-btn-yellow">
            {reset.isPending ? 'UPDATING…' : 'UPDATE PASSWORD'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
