import { useNavigate } from 'react-router-dom';

const LEGAL_ITEMS: Array<{ title: string; path: string }> = [
  { title: 'General Terms & Conditions', path: '/legal/general-terms' },
  { title: 'Terms & Conditions for 3rd party services', path: '/legal/third-party' },
  { title: 'Refund & cancellation policy', path: '/legal/refund' },
  { title: 'Privacy policy', path: '/legal/privacy' },
  { title: 'Terms & Conditions for credit', path: '/legal/credit' },
  { title: 'Terms & conditions for GPS', path: '/legal/gps' },
  { title: 'Contact Us', path: '/legal/contact' },
];

export default function LegalPage(): JSX.Element {
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-md space-y-3 p-3">
      <h2 className="text-lg font-bold">Legal</h2>
      <div>
        {LEGAL_ITEMS.map((item) => (
          <button
            key={item.path}
            type="button"
            onClick={() => navigate(item.path)}
            className="my-2 block w-full cursor-pointer rounded-md bg-gray-100 p-4 text-left text-sm transition-colors hover:bg-gray-200"
          >
            {item.title}
          </button>
        ))}
      </div>
    </div>
  );
}
