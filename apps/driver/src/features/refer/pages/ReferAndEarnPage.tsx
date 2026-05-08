import { useState } from 'react';
import { Check, Clipboard, Gift, Wallet } from 'lucide-react';
import { useAuthStore } from '@store/auth.store';

export default function ReferAndEarnPage(): JSX.Element {
  const driver = useAuthStore((s) => s.driver);
  const referralCode = driver?.driverId ? `SENDO-${driver.driverId}` : 'SENDO-DRIVER';
  const [copied, setCopied] = useState(false);
  const [withdrawn, setWithdrawn] = useState(false);

  const referrals = 0;
  const bonus = referrals * 100;

  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (): void => {
    const msg = `Hey! Join Sendo Logistics — use my referral code ${referralCode} when you sign up!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="mx-auto max-w-md space-y-3 p-2">
      <div className="overflow-hidden rounded-md border-2 border-black shadow-md">
        <div className="bg-black px-4 py-3 text-lg font-bold text-yellow-400">Refer &amp; Earn</div>
        <div className="space-y-3 bg-white p-4">
          <p className="text-xs leading-relaxed text-gray-600">
            Share your referral code with friends. Earn ₹100 for every driver you refer who joins Sendo!
          </p>

          <div className="border-b-2 border-yellow-400 pb-1 text-sm font-bold">Your Referral Code</div>
          <div className="flex items-center justify-between rounded-md border-2 border-black bg-gray-50 px-3 py-2">
            <span className="text-lg font-bold tracking-widest">{referralCode}</span>
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="flex items-center gap-1 rounded-md bg-yellow-400 px-3 py-2 text-xs font-bold"
            >
              {copied ? <Check size={14} /> : <Clipboard size={14} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <div className="flex items-center gap-2 rounded-md border-2 border-black bg-gray-50 px-3 py-2 text-sm">
            <Gift size={20} color="#FFC107" />
            <span><strong>Total Bonus Earned:</strong></span>
            <span className="ml-auto text-lg font-bold">₹{bonus}</span>
          </div>

          <button
            type="button"
            onClick={handleShare}
            className="w-full rounded-md bg-yellow-400 px-3 py-3 text-sm font-bold text-black"
          >
            📲 Share on WhatsApp
          </button>

          <button
            type="button"
            onClick={() => {
              setWithdrawn(true);
              setTimeout(() => setWithdrawn(false), 3000);
            }}
            className={`w-full rounded-md px-3 py-3 text-sm font-bold text-white ${withdrawn ? 'bg-green-600' : 'bg-black'}`}
          >
            <Wallet size={14} className="mr-2 inline align-middle" />
            {withdrawn ? 'Processing Withdrawal…' : 'Withdraw Earnings'}
          </button>

          <div className="border-b-2 border-yellow-400 pb-1 text-sm font-bold">How It Works</div>
          <ol className="list-decimal pl-5 text-xs leading-relaxed text-gray-600">
            <li className="mb-1">Share your referral code with a friend</li>
            <li className="mb-1">They use it when registering with Sendo</li>
            <li className="mb-1">You earn ₹100 once they complete 30 days</li>
            <li>Withdraw your earnings anytime to your bank account</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
