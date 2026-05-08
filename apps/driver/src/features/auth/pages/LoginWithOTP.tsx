import { type FormEvent, useState } from 'react';
import { useSendOtp } from '../auth.hooks';

const PHONE_RE = /^\+?\d{6,15}$/;

export default function LoginWithOTP(): JSX.Element {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const sendOtp = useSendOtp();

  const onSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!PHONE_RE.test(phone.trim())) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setError(null);
    sendOtp.mutate(phone.trim());
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{
        backgroundImage:
          "url('https://www.newwesterncarrier.in/wp-content/uploads/2023/06/truck.jpeg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="w-[90%] max-w-sm rounded-xl bg-white px-6 py-8 text-center shadow-lg">
        <img
          src="https://sendonow.com/Images/Logo.png"
          alt="Sendo"
          className="mx-auto mb-4 w-32"
        />
        <div className="mb-4 rounded-lg bg-black py-2.5 text-base font-bold text-sendo-yellow">
          Driver Login
        </div>
        <p className="mb-4 text-xs text-gray-500">Enter your registered mobile number</p>

        <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
          <div className="mb-1 flex overflow-hidden rounded-lg border-[1.5px] border-black">
            <span className="flex items-center whitespace-nowrap border-r-[1.5px] border-black bg-gray-100 px-3 py-2.5 text-sm text-gray-700">
              IN +91
            </span>
            <input
              type="tel"
              inputMode="numeric"
              required
              maxLength={10}
              autoComplete="tel"
              placeholder="10-digit mobile number"
              className="w-full px-3 py-2.5 text-[15px] tracking-wide outline-none"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value.replace(/\D/g, ''));
                if (error) setError(null);
              }}
            />
          </div>
          <button
            type="submit"
            disabled={sendOtp.isPending || !phone}
            className="w-full rounded-lg bg-sendo-yellow p-3 text-[15px] font-bold text-black disabled:opacity-70"
          >
            {sendOtp.isPending ? 'Sending OTP...' : 'GET OTP'}
          </button>
        </form>

        {error ? (
          <p className="mt-2.5 text-xs font-bold text-red-600">{error}</p>
        ) : null}

        <div className="mt-6 flex justify-between text-[11px] text-gray-400">
          <span>LANGUAGE</span>
          <span>HOW TO SIGN UP?</span>
          <span>v7.4.0</span>
        </div>
      </div>
    </div>
  );
}
