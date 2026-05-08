import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignUp } from '../auth.hooks';

export function SignInPage(): JSX.Element {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const signUp = useSignUp();

  const onSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    signUp.mutate(form);
  };

  return (
    <div className="flex h-screen items-center justify-center bg-sendo-page">
      <div className="w-[90%] max-w-[400px] rounded-[10px] bg-white p-6 shadow-[0_4px_6px_rgba(0,0,0,0.1)]">
        <h2 className="mb-4 text-center text-xl font-semibold">Sign Up</h2>
        <form className="flex flex-col gap-3" onSubmit={onSubmit}>
          <input
            required
            placeholder="Full Name"
            className="sendo-input"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
          <input
            required
            type="email"
            placeholder="Email"
            className="sendo-input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            required
            minLength={8}
            type="password"
            placeholder="Password (min 8 chars)"
            className="sendo-input"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <button type="submit" disabled={signUp.isPending} className="sendo-btn-yellow">
            {signUp.isPending ? 'SIGNING UP…' : 'SIGN UP'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-sm text-black hover:underline"
          >
            Already have an account? Log in
          </button>
        </form>
      </div>
    </div>
  );
}

export default SignInPage;
