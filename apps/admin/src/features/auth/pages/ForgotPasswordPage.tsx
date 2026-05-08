import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForgotPassword, useVerifyOtp } from '../auth.hooks';

export function ForgotPasswordPage(): JSX.Element {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');

  const forgot = useForgotPassword();
  const verify = useVerifyOtp();

  const onSendOtp = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    forgot.mutate(email, {
      onSuccess: () => setStep('otp'),
    });
  };

  const onVerify = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    verify.mutate(
      { email, userOtp: otp },
      { onSuccess: () => navigate(`/reset-password?email=${encodeURIComponent(email)}`) },
    );
  };

  return (
    <div className="flex h-screen items-center justify-center bg-sendo-page">
      <div className="w-[90%] max-w-[400px] rounded-[10px] bg-white p-6 shadow-[0_4px_6px_rgba(0,0,0,0.1)]">
        <h2 className="mb-4 text-center text-xl font-semibold">Forgot Password</h2>

        {step === 'email' ? (
          <form className="flex flex-col gap-3" onSubmit={onSendOtp}>
            <input
              required
              type="email"
              placeholder="Email"
              className="sendo-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" disabled={forgot.isPending} className="sendo-btn-yellow">
              {forgot.isPending ? 'SENDING…' : 'SEND OTP'}
            </button>
          </form>
        ) : (
          <form className="flex flex-col gap-3" onSubmit={onVerify}>
            <p className="text-sm text-gray-600">OTP sent to {email}</p>
            <input
              required
              minLength={4}
              maxLength={8}
              inputMode="numeric"
              pattern="[0-9]{4,8}"
              autoComplete="one-time-code"
              placeholder="Enter OTP"
              className="sendo-input"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <button type="submit" disabled={verify.isPending} className="sendo-btn-yellow">
              {verify.isPending ? 'VERIFYING…' : 'VERIFY OTP'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
