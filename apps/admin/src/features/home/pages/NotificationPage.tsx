import { useRef, useState } from 'react';

const TABS = ['Eicher Live+', 'After Market', 'Payments', 'Consent'] as const;
type Tab = (typeof TABS)[number];

const ALERT_OPTIONS: Record<Tab, string[]> = {
  'Eicher Live+': [
    'All',
    'Stop Now',
    'Visit Soon',
    'Driver Alerts',
    'Fuel Drain',
    'Fuel Refill',
    'Over Speeding',
    'Over Stoppage',
    'Geofence Entry',
    'Geofence Exit',
    'Route Deviation',
    'Harsh Braking',
    'Excessive Idling',
    'Harsh Acceleration',
    'Low SOC',
  ],
  'After Market': ['All', 'Breakdown', 'Service'],
  Payments: ['All', 'AMC', 'Insurance', 'Eicher Live+'],
  Consent: ['All', 'Telematics', 'Opspod'],
};

export default function NotificationPage(): JSX.Element {
  const [search, setSearch] = useState('');
  const [alertType, setAlertType] = useState('All');
  const [alerts, setAlerts] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const tabsRef = useRef<Array<HTMLButtonElement | null>>([]);

  const handleSearch = (): void => setAlerts([]);

  const onClick = (index: number): void => {
    setActiveIndex(index);
    setAlertType('All');
    tabsRef.current[index]?.scrollIntoView({ behavior: 'smooth', inline: 'center' });
  };

  const activeTab = TABS[activeIndex];

  return (
    <div className="sendo-page">
      <h2 className="sendo-heading">🔔 Notifications</h2>
      <div className="max-w-[900px] px-6 py-6">
        <div className="mb-4 text-[22px] font-bold">My Notifications</div>

        <div className="mb-5 overflow-x-auto whitespace-nowrap border-b-2 border-[#e0e0e0] pb-1.5">
          <div className="flex gap-4">
            {TABS.map((tab, index) => (
              <button
                key={tab}
                type="button"
                ref={(el) => {
                  tabsRef.current[index] = el;
                }}
                onClick={() => onClick(index)}
                className={`whitespace-nowrap border-0 bg-transparent px-4 py-3 text-[15px] transition-all ${
                  activeIndex === index
                    ? 'border-b-[3px] border-sendo-yellow font-bold text-black'
                    : 'border-b-[3px] border-transparent text-[#888]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-2.5">
          <input
            type="text"
            placeholder="Enter Reg No. / Chassis No."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[200px] flex-1 rounded border-[1.5px] border-black px-3 py-2 text-[13px] outline-none"
          />
          <select
            value={alertType}
            onChange={(e) => setAlertType(e.target.value)}
            className="w-[180px] rounded border-[1.5px] border-black bg-white px-2.5 py-2 text-[13px] outline-none"
          >
            {ALERT_OPTIONS[activeTab].map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleSearch}
            className="whitespace-nowrap rounded border-[1.5px] border-sendo-yellow bg-sendo-yellow px-5 py-2 text-[13px] font-bold text-black"
          >
            Submit
          </button>
        </div>

        <div className="rounded-md border-[1.5px] border-black bg-white p-4 shadow-[0_2px_6px_rgba(0,0,0,0.08)]">
          <div className="mb-2.5 text-[15px] font-bold">Showing {alerts.length} Alerts</div>
          {alerts.length === 0 ? (
            <div className="py-7 text-center text-[14px] text-[#aaa]">
              <div className="mb-2 text-[2rem]">🔕</div>
              No Alerts Generated!
            </div>
          ) : (
            alerts.map((a, i) => (
              <div key={i} className="border-b border-[#f0f0f0] py-2 text-[13px]">
                {a}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
