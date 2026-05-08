import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Card {
  icon: string;
  title: string;
  description: string;
  btn: string;
  action: (() => void) | null;
}

interface ContactItem {
  icon: string;
  label: string;
  value: string;
}

interface Faq {
  q: string;
  a: string;
}

export default function HelpSupportPage(): JSX.Element {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const cards: Card[] = [
    {
      icon: '📖',
      title: 'Getting Started',
      description: 'Everything you need to know to get started with the Sendo Driver platform.',
      btn: 'READ MORE',
      action: null,
    },
    {
      icon: '📝',
      title: 'Raise a Request',
      description: 'Let us know your issue — our support team is here to help you.',
      btn: 'EXPLORE',
      action: null,
    },
    {
      icon: '📋',
      title: 'My Requests',
      description: 'View the status of your current and past support requests.',
      btn: 'VIEW',
      action: () => navigate('/my-requests'),
    },
    {
      icon: '📞',
      title: 'Contact Us',
      description: 'Find all the ways you can reach our support team.',
      btn: 'VIEW',
      action: null,
    },
  ];

  const contacts: ContactItem[] = [
    { icon: '📧', label: 'Email Support', value: 'support@sendo.in' },
    { icon: '📞', label: 'Phone Support', value: '+91 98765 43210' },
    { icon: '🕐', label: 'Support Hours', value: 'Mon–Sat, 9:00 AM – 6:00 PM' },
    { icon: '📍', label: 'Office Address', value: 'Sendo HQ, Bangalore, Karnataka' },
  ];

  const faqs: Faq[] = [
    {
      q: 'How do I add a new vehicle?',
      a: 'Go to Vehicle Management → Onboarding, fill in the vehicle details and submit the form.',
    },
    {
      q: 'How do I record diesel expenses?',
      a: 'Navigate to Vehicle Management → Diesel, fill in the entry form and click Save Entry.',
    },
    {
      q: 'How do I approve a leave request?',
      a: 'Go to Driver Management → Leave Requests and use the Approve or Reject buttons on pending requests.',
    },
    {
      q: 'How do I download CSV reports?',
      a: 'Most pages have a Download CSV button at the top-right of the records table.',
    },
    {
      q: 'How do I track vehicles live?',
      a: 'Go to Vehicle Management → Live Fleet Tracking to see real-time vehicle locations on the map.',
    },
  ];

  return (
    <div className="sendo-page">
      <div className="bg-sendo-yellow px-5 py-4 text-[22px] font-bold uppercase tracking-wider text-black">
        HELP & SUPPORT
      </div>
      <div className="px-5 py-6">
        <div className="mb-4 mt-2.5 border-b-2 border-sendo-yellow pb-1.5 text-[15px] font-bold">
          How Can We Help You?
        </div>
        <div className="mb-8 grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {cards.map((card) => (
            <div
              key={card.title}
              className="flex flex-col items-center gap-2.5 rounded-md border-[1.5px] border-black bg-white px-5 py-6 text-center hover:bg-[#fffde7]"
            >
              <div className="text-[40px]">{card.icon}</div>
              <div className="text-[15px] font-bold">{card.title}</div>
              <div className="text-[13px] leading-relaxed text-[#555]">{card.description}</div>
              <button
                type="button"
                onClick={card.action ?? undefined}
                className="mt-2 rounded bg-sendo-yellow px-5 py-1.5 text-[13px] font-bold text-black"
              >
                {card.btn}
              </button>
            </div>
          ))}
        </div>

        <div className="mb-4 mt-2.5 border-b-2 border-sendo-yellow pb-1.5 text-[15px] font-bold">
          Contact Information
        </div>
        <div className="mb-8 grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {contacts.map((c) => (
            <div
              key={c.label}
              className="flex items-start gap-3.5 rounded-md border-[1.5px] border-black bg-[#fafafa] px-5 py-4"
            >
              <div className="mt-0.5 text-[28px]">{c.icon}</div>
              <div>
                <div className="mb-1 text-[14px] font-bold">{c.label}</div>
                <div className="text-[13px] text-[#555]">{c.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-4 mt-2.5 border-b-2 border-sendo-yellow pb-1.5 text-[15px] font-bold">
          Frequently Asked Questions
        </div>
        {faqs.map((faq, i) => (
          <div key={faq.q} className="border-b border-[#f0f0f0] py-3.5">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setOpenFaq(openFaq === i ? null : i);
                }
              }}
              className="flex cursor-pointer items-center justify-between text-[14px] font-bold"
            >
              <span>{faq.q}</span>
              <span>{openFaq === i ? '▲' : '▼'}</span>
            </div>
            {openFaq === i && (
              <div className="mt-2.5 text-[13px] leading-relaxed text-[#555]">{faq.a}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
