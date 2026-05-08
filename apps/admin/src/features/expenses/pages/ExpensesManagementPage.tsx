import { useNavigate } from 'react-router-dom';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';

interface Tile {
  label: string;
  path: string;
  icon: string;
  desc: string;
}

const TILES: Tile[] = [
  { label: 'Vehicle Expenses', path: '/vehicle-expenses', icon: '🚛', desc: 'Fuel, repair & maintenance costs' },
  { label: 'Other Expenses', path: '/others', icon: '📋', desc: 'Office & miscellaneous expenses' },
];

export default function ExpensesManagementPage(): JSX.Element {
  const nav = useNavigate();
  return (
    <SendoLegacyPage title="Expense Management">
      <div className="grid max-w-[600px] grid-cols-2 gap-6 p-6">
        {TILES.map((t) => (
          <button
            key={t.path}
            type="button"
            onClick={() => nav(t.path)}
            className="cursor-pointer rounded-md border-2 border-transparent bg-white px-5 py-9 text-center shadow-[0_2px_8px_rgba(0,0,0,0.10)] transition-all hover:-translate-y-0.5 hover:border-sendo-yellow"
          >
            <div className="mb-3 text-[44px]">{t.icon}</div>
            <div className="mb-2 text-[15px] font-bold">{t.label}</div>
            <div className="text-[12px] text-[#888]">{t.desc}</div>
          </button>
        ))}
      </div>
    </SendoLegacyPage>
  );
}
