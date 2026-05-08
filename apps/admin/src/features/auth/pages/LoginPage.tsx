import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useLogin } from '../auth.hooks';

const LOGIN_BG_URL =
  'https://img.freepik.com/free-photo/vehicle-move_23-2151846035.jpg?t=st=1740754352~exp=1740757952~hmac=c0ea2c637dcc8e3a4d3d536797c4ca69e04c733f296941ab5fb5929653fd65ba&w=1380';

export function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const login = useLogin();

  const onSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    login.mutate(credentials);
  };

  return (
    <div
      className="flex h-screen items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url('${LOGIN_BG_URL}')` }}
    >
      <div className="w-[90%] max-w-[350px] rounded-[10px] bg-white p-5 text-center shadow-[0_4px_6px_rgba(0,0,0,0.1)]">
        <img src="https://sendonow.com/Images/Logo.png" alt="Sendo" className="mb-2.5 inline-block w-[150px]" />
        <h2 className="m-0 mb-3 text-xl font-semibold">Log in</h2>
        <form className="flex flex-col gap-2.5" onSubmit={onSubmit}>
          <input
            type="email"
            name="email"
            required
            placeholder="Email"
            className="rounded-[5px] border border-[#ccc] p-2.5 text-sm outline-none focus:border-sendo-yellow"
            value={credentials.email}
            onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
          />
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              required
              placeholder="Password"
              className="w-full rounded-[5px] border border-[#ccc] p-2.5 pr-10 text-sm outline-none focus:border-sendo-yellow"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
            />
            <button
              type="button"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 border-0 bg-transparent"
              onClick={() => setShowPassword((p) => !p)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {login.error && (
            <p className="m-0 text-sm text-red-600">
              {(login.error as Error).message}
            </p>
          )}
          <button
            type="submit"
            disabled={login.isPending}
            className="cursor-pointer rounded-[5px] border-0 bg-[rgb(253,212,10)] p-2.5 font-bold text-white disabled:opacity-60"
          >
            {login.isPending ? 'LOGGING IN…' : 'LOGIN'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/sign-in')}
            className="cursor-pointer border-0 bg-transparent p-0 text-sm text-black hover:underline"
          >
            New User? Sign Up
          </button>
          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            className="cursor-pointer border-0 bg-transparent p-0 text-sm text-black hover:underline"
          >
            Forgot Password?
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
