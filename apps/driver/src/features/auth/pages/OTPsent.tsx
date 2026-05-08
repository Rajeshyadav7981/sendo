import { type FormEvent, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSendOtp, useVerifyOtp } from '../auth.hooks';

const OTP_LEN = 4;

export default function OTPsent(): JSX.Element {
  const [params] = useSearchParams();
  const phone = params.get('phone') ?? '';
  const [otp, setOtp] = useState<string[]>(Array(OTP_LEN).fill(''));
  const [timer, setTimer] = useState(120);
  const [resendDisabled, setResendDisabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const verify = useVerifyOtp();
  const sendOtp = useSendOtp();

  useEffect(() => {
    if (timer <= 0) {
      setResendDisabled(false);
      return;
    }
    const id = setInterval(() => setTimer((p) => p - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const handleChange = (i: number, v: string): void => {
    if (!/^[0-9]?$/.test(v)) return;
    const next = [...otp];
    next[i] = v;
    setOtp(next);
    if (v && i < OTP_LEN - 1) inputsRef.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputsRef.current[i - 1]?.focus();
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const entered = otp.join('');
    if (entered.length < OTP_LEN) {
      setError('Please enter the 4-digit OTP.');
      return;
    }
    setError(null);
    verify.mutate({ phone, otp: entered });
  };

  const resendOtp = (): void => {
    setOtp(Array(OTP_LEN).fill(''));
    setResendDisabled(true);
    setTimer(120);
    setError(null);
    sendOtp.mutate(phone);
  };

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{
        backgroundImage:
          "url('https://www.newwesterncarrier.in/wp-content/uploads/2023/06/truck.jpeg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="h-52" />
      <div className="mx-auto w-[90%] max-w-sm rounded-xl bg-white px-6 py-7 text-center shadow-lg">
        <img
          src="https://sendonow.com/Images/Logo.png"
          alt="Sendo"
          className="mx-auto mb-3 w-24"
        />
        <h2 className="mb-1 text-[15px] font-semibold">Enter OTP sent to your mobile</h2>
        <p className="mb-4 text-xs text-gray-500">+91 {phone}</p>

        <form onSubmit={onSubmit}>
          <div className="mb-5 flex justify-center gap-2.5">
            {otp.map((v, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputsRef.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={v}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`h-[52px] w-12 rounded-lg border-2 border-black text-center text-2xl outline-none ${
                  v ? 'bg-sendo-yellow' : 'bg-white'
                }`}
              />
            ))}
          </div>

          {error ? (
            <p className="mb-3 text-xs font-bold text-red-600">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={verify.isPending}
            className="mx-auto mb-2.5 block w-full max-w-[260px] rounded-3xl bg-sendo-yellow p-3 text-[15px] font-bold text-black disabled:opacity-70"
          >
            {verify.isPending ? 'Verifying...' : 'VERIFY & PROCEED'}
          </button>

          <button
            type="button"
            onClick={resendOtp}
            disabled={resendDisabled}
            className={`mx-auto block w-full max-w-[260px] rounded-3xl p-3 text-sm font-bold ${
              resendDisabled
                ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                : 'bg-black text-sendo-yellow'
            }`}
          >
            {resendDisabled ? `Resend OTP in ${timer}s` : 'RESEND OTP'}
          </button>
        </form>
      </div>

      <div className="mt-auto flex justify-between px-5 py-4 text-[11px] text-white">
        <span>LANGUAGE</span>
        <span>HOW TO SIGN UP?</span>
        <span>v7.4.0</span>
      </div>
    </div>
  );
}
