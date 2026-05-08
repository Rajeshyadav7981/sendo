import { useNavigate, useParams } from 'react-router-dom';

const SECTION_TITLES: Record<string, string> = {
  'general-terms': 'General Terms & Conditions',
  'third-party': 'Terms & Conditions for 3rd party services',
  refund: 'Refund & cancellation policy',
  privacy: 'Privacy policy',
  credit: 'Terms & Conditions for credit',
  gps: 'Terms & conditions for GPS',
  contact: 'Contact Us',
};

export default function LegalSectionPage(): JSX.Element {
  const navigate = useNavigate();
  const { section = '' } = useParams();
  const title = SECTION_TITLES[section] ?? 'Legal';

  return (
    <div className="mx-auto max-w-2xl space-y-3 p-3">
      <button
        type="button"
        onClick={() => navigate('/legal')}
        className="rounded-md bg-yellow-400 px-3 py-1.5 text-xs font-bold"
      >
        ← Back
      </button>
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="rounded-md border-2 border-black bg-white p-4 text-sm leading-relaxed text-gray-700">
        Content for &quot;{title}&quot; will be available shortly. Please contact support for the current document.
      </div>
    </div>
  );
}
