import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, X } from 'lucide-react';
import { useAuthStore } from '@store/auth.store';
import { useTripStore } from '@store/trip.store';
import { useVehicleOnboarding } from '@features/onboarding/onboarding.hooks';
import { buildDocumentUrl, listAvailableDocuments } from '../documents.api';

export default function DriverDocumentPage(): JSX.Element {
  const navigate = useNavigate();
  const tripVehicle = useTripStore((s) => s.vehicleNumber);
  const driverVehicle = useAuthStore((s) => s.driver?.vehicleNumber ?? '');
  const vehicleNumber = tripVehicle || driverVehicle;

  const { data: vehicle, isLoading } = useVehicleOnboarding(vehicleNumber);
  const docs = useMemo(() => (vehicle ? listAvailableDocuments(vehicle) : []), [vehicle]);

  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [previewUrl, setPreviewUrl] = useState('');

  if (!vehicleNumber) {
    return (
      <div className="mx-auto max-w-xl space-y-3 p-2">
        <div className="rounded-md border-2 border-yellow-400 bg-yellow-50 p-5 text-center font-bold text-yellow-800">
          Please start the Trip Timer before viewing Vehicle Documents
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-md bg-black px-4 py-2 text-xs font-bold text-white"
        >
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-3 p-2">
      <div className="overflow-hidden rounded-md border-2 border-black shadow-md">
        <div className="flex items-center justify-between bg-black px-4 py-3 text-lg font-bold text-yellow-400">
          <span>Vehicle Documents</span>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-md bg-yellow-400 px-3 py-1.5 text-xs font-bold text-black"
          >
            ← Back
          </button>
        </div>
        <div className="bg-white p-3">
          <div className="mb-3 rounded-md border-2 border-black bg-gray-50 px-3 py-2 text-xs">
            <strong>Vehicle:</strong> {vehicleNumber || '—'} &nbsp;|&nbsp;
            <strong>Type:</strong> {vehicle?.vehicleType || '—'}
          </div>

          {isLoading ? (
            <p className="text-center text-xs text-gray-500">Loading…</p>
          ) : docs.length === 0 ? (
            <p className="text-center text-xs text-gray-500">No documents available for this vehicle.</p>
          ) : (
            docs.map((d, i) => {
              const isPdf = d.path.toLowerCase().endsWith('.pdf');
              const url = buildDocumentUrl(d.path);
              const open = !!visible[d.key];
              return (
                <div
                  key={d.key}
                  className={`flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 p-2 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                >
                  <span className="text-sm font-bold">{d.label}</span>
                  <button
                    type="button"
                    onClick={() => setVisible((prev) => ({ ...prev, [d.key]: !prev[d.key] }))}
                    className="flex items-center gap-1 rounded-md bg-yellow-400 px-3 py-1.5 text-xs font-bold"
                  >
                    {open ? <EyeOff size={14} /> : <Eye size={14} />}
                    {open ? 'Hide' : 'View'}
                  </button>
                  {open && (
                    <div className="mt-2 w-full">
                      {isPdf ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-bold text-blue-600"
                        >
                          📄 Open PDF
                        </a>
                      ) : (
                        <img
                          src={url}
                          alt={d.label}
                          onClick={() => setPreviewUrl(url)}
                          className="h-32 w-44 cursor-pointer rounded-md border-2 border-black object-cover"
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setPreviewUrl('')}
        >
          <button
            type="button"
            onClick={() => setPreviewUrl('')}
            className="fixed right-6 top-24 z-[51] flex h-10 w-10 items-center justify-center rounded-full bg-yellow-400"
          >
            <X size={20} />
          </button>
          <img
            src={previewUrl}
            alt="Preview"
            className="max-h-[88vh] max-w-[92%] rounded-md"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
