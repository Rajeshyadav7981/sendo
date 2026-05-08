import { type ChangeEvent, type FormEvent, useState } from 'react';
import { useAuthStore } from '@store/auth.store';
import { toastSuccess } from '@shared/lib/toast';

interface ProfileForm {
  fullName: string;
  eicherId: string;
  phoneNumber: string;
  isWhatsapp: 'Yes' | 'No';
  whatsappNumber: string;
  communicationChannel: string[];
  dob: string;
  email: string;
  applications: string;
}

const CHANNELS = ['Phone', 'WhatsApp', 'Email'];
const APPLICATIONS = ['Uber', 'Ola', 'TruckBazaar'];

export default function MyProfilePage(): JSX.Element {
  const user = useAuthStore((s) => s.user);

  const [form, setForm] = useState<ProfileForm>({
    fullName: user?.fullName ?? 'OMEG GLOBAL LOGISTICS',
    eicherId: '1124034',
    phoneNumber: '+918179696364',
    isWhatsapp: 'No',
    whatsappNumber: '',
    communicationChannel: [],
    dob: '',
    email: user?.email ?? 'Instanttrans@gmail.com',
    applications: '',
  });

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value, type } = e.target;
    if (type === 'checkbox' && e.target instanceof HTMLInputElement) {
      const checked = e.target.checked;
      setForm((p) => ({
        ...p,
        communicationChannel: checked
          ? [...p.communicationChannel, value]
          : p.communicationChannel.filter((c) => c !== value),
      }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    toastSuccess('Profile saved successfully!');
  };

  return (
    <div className="sendo-page">
      <div className="bg-sendo-yellow px-5 py-4 text-[22px] font-bold uppercase tracking-wider text-black">
        MY PROFILE
      </div>

      <div className="px-5 py-6">
        <form onSubmit={onSubmit}>
          <div className="mb-4 mt-2.5 border-b-2 border-sendo-yellow pb-1.5 text-[15px] font-bold">
            Basic Information
          </div>
          <div className="mb-6 grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
            <Field label="Full Name *">
              <input
                type="text"
                name="fullName"
                required
                className="sendo-input"
                value={form.fullName}
                onChange={onChange}
              />
            </Field>
            <Field label="My Eicher ID *">
              <input
                type="text"
                name="eicherId"
                required
                className="sendo-input"
                value={form.eicherId}
                onChange={onChange}
              />
            </Field>
            <Field label="Date of Birth">
              <input
                type="date"
                name="dob"
                className="sendo-input"
                value={form.dob}
                onChange={onChange}
              />
            </Field>
            <Field label="Email ID *">
              <input
                type="email"
                name="email"
                required
                className="sendo-input"
                value={form.email}
                onChange={onChange}
              />
            </Field>
          </div>

          <div className="mb-4 mt-2.5 border-b-2 border-sendo-yellow pb-1.5 text-[15px] font-bold">
            Contact Information
          </div>
          <div className="mb-6 grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
            <Field label="Phone Number *">
              <input
                type="text"
                name="phoneNumber"
                required
                className="sendo-input"
                value={form.phoneNumber}
                onChange={onChange}
              />
            </Field>
            <Field label="Is this your WhatsApp Number? *">
              <div className="flex items-center gap-5 pt-1.5">
                {(['Yes', 'No'] as const).map((opt) => (
                  <label key={opt} className="flex cursor-pointer items-center gap-1.5 text-[14px]">
                    <input
                      type="radio"
                      name="isWhatsapp"
                      value={opt}
                      checked={form.isWhatsapp === opt}
                      onChange={onChange}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </Field>
            {form.isWhatsapp === 'No' && (
              <Field label="WhatsApp Number *">
                <input
                  type="text"
                  name="whatsappNumber"
                  required
                  className="sendo-input"
                  value={form.whatsappNumber}
                  onChange={onChange}
                />
              </Field>
            )}
            <Field label="Preferred Communication Channel *">
              <div className="flex flex-wrap items-center gap-4 pt-1.5">
                {CHANNELS.map((ch) => (
                  <label key={ch} className="flex cursor-pointer items-center gap-1.5 text-[14px]">
                    <input
                      type="checkbox"
                      value={ch}
                      checked={form.communicationChannel.includes(ch)}
                      onChange={onChange}
                    />
                    {ch}
                  </label>
                ))}
              </div>
            </Field>
          </div>

          <div className="mb-4 mt-2.5 border-b-2 border-sendo-yellow pb-1.5 text-[15px] font-bold">
            Application Details
          </div>
          <div className="mb-6 grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
            <Field label="Vehicle Operations Platform">
              <select
                name="applications"
                className="sendo-input"
                value={form.applications}
                onChange={onChange}
              >
                <option value="">Select Your Application</option>
                {APPLICATIONS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="flex justify-end gap-3 pb-2.5">
            <button
              type="button"
              className="rounded bg-[#c62828] px-7 py-2 text-[14px] font-bold text-white"
            >
              Deactivate Account
            </button>
            <button type="submit" className="sendo-btn-yellow px-7 py-2 text-[14px]">
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <div>
      <label className="mb-1.5 block text-[14px] font-bold">{label}</label>
      {children}
    </div>
  );
}
