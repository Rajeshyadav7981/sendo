import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Mail, Phone } from 'lucide-react';

const FAQS: Array<{ q: string; a: string }> = [
  { q: 'How do I change my phone number?', a: 'Please contact your admin or fleet manager to update your registered phone number.' },
  { q: 'How do I refer a friend?', a: 'Go to Menu → Refer & Earn to find your referral code. Share it with other drivers.' },
  { q: 'What if my attendance was not recorded?', a: "Make sure to click 'Mark Attendance' after stopping the trip timer. Contact your admin if the issue persists." },
  { q: 'How is my payout calculated?', a: 'Payout = (Basic Payment ÷ Total Days) × Working Days + Referral Bonus − Advance Deductions − Other Deductions.' },
  { q: 'How do I request a leave?', a: 'Go to Menu → Driver Leave Request. Fill in the dates and reason, then submit. Your admin will review it.' },
  { q: 'How do I request an advance?', a: "Go to Menu → Driver Advances, enter the amount, and tap 'Request Advance'. Wait for admin approval." },
];

export default function HelpPage(): JSX.Element {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-xl space-y-3 p-2">
      <div className="overflow-hidden rounded-md border-2 border-black shadow-md">
        <div className="flex items-center gap-2 bg-black px-4 py-3 text-lg font-bold text-yellow-400">
          <HelpCircle size={20} />
          Help &amp; Support
        </div>
        <div className="space-y-3 bg-white p-3">
          <div className="border-b-2 border-yellow-400 pb-1 text-sm font-bold">
            Frequently Asked Questions
          </div>
          {FAQS.map((faq, i) => (
            <div key={faq.q} className="overflow-hidden rounded-md border-2 border-black">
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between bg-gray-50 px-3 py-3 text-left text-sm font-bold"
              >
                <span>{faq.q}</span>
                {open === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {open === i && (
                <div className="border-t border-gray-200 p-3 text-xs leading-relaxed text-gray-700">
                  {faq.a}
                </div>
              )}
            </div>
          ))}

          <div className="rounded-md border-2 border-black bg-gray-50 p-3">
            <div className="border-b-2 border-yellow-400 pb-1 text-sm font-bold">Contact Support</div>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <Mail size={16} color="#FFC107" />
              <span>support@sendonow.com</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <Phone size={16} color="#FFC107" />
              <span>+91 98765 43210</span>
            </div>
            <p className="mt-2 text-xs text-gray-500">Support hours: Mon–Sat, 9 AM – 6 PM</p>
          </div>
        </div>
      </div>
    </div>
  );
}
