import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';
import { toastError } from '@shared/lib/toast';
import type { CreateVendorBody } from '../vendors.api';

interface FormState {
  supplierName: string;
  venderSiteCode: '' | 'Rental' | 'Adhoc';
  phoneNumber: string;
  emailId: string;
  addressLine1: string;
  addressLine2: string;
  townCity: string;
  state: string;
  pinCode: string;
  serviceRegistrationNumber: string;
  serviceTax: string;
  panNumber: string;
  tdsRateSection: string;
  beneficiaryName: string;
  accountNumber: string;
  IFSCcode: string;
  branchName: string;
  notes: string;
}

const blank: FormState = {
  supplierName: '',
  venderSiteCode: '',
  phoneNumber: '',
  emailId: '',
  addressLine1: '',
  addressLine2: '',
  townCity: '',
  state: '',
  pinCode: '',
  serviceRegistrationNumber: '',
  serviceTax: '',
  panNumber: '',
  tdsRateSection: '',
  beneficiaryName: '',
  accountNumber: '',
  IFSCcode: '',
  branchName: '',
  notes: '',
};

const SUPPLIER_RE = /^[a-zA-Z0-9 .,&'()/\-]{2,200}$/;
const PHONE_RE = /^[0-9]{10}$/;
const PIN_RE = /^[0-9]{6}$/;
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(form: FormState): string | null {
  if (!SUPPLIER_RE.test(form.supplierName.trim()))
    return 'Supplier Name: use letters, numbers and common business characters (min 2 chars).';
  if (!form.venderSiteCode) return 'Select a Vendor Site Code.';
  if (!PHONE_RE.test(form.phoneNumber)) return 'Phone Number should be 10 digits.';
  if (!PIN_RE.test(form.pinCode)) return 'Pin Code should be 6 digits.';
  if (!PAN_RE.test(form.panNumber.trim().toUpperCase())) return 'Invalid PAN Number format.';
  if (!IFSC_RE.test(form.IFSCcode.trim().toUpperCase())) return 'Invalid IFSC Code format.';
  if (!EMAIL_RE.test(form.emailId.trim())) return 'Enter a valid email address.';
  if (!form.addressLine1.trim()) return 'Address Line 1 is required.';
  if (!form.townCity.trim()) return 'Town/City is required.';
  if (!form.state.trim()) return 'State is required.';
  if (!form.serviceRegistrationNumber.trim())
    return 'Service Registration Number (GST) is required.';
  if (!form.beneficiaryName.trim()) return 'Beneficiary Name is required.';
  if (!form.accountNumber.trim()) return 'Account Number is required.';
  if (!form.branchName.trim()) return 'Branch Name is required.';
  return null;
}

function normalize(form: FormState): CreateVendorBody {
  return {
    supplierName: form.supplierName.trim(),
    venderSiteCode: form.venderSiteCode as 'Rental' | 'Adhoc',
    phoneNumber: form.phoneNumber.trim(),
    addressLine1: form.addressLine1.trim(),
    addressLine2: form.addressLine2.trim() || null,
    townCity: form.townCity.trim(),
    state: form.state.trim(),
    pinCode: form.pinCode.trim(),
    emailId: form.emailId.trim().toLowerCase(),
    serviceRegistrationNumber: form.serviceRegistrationNumber.trim(),
    serviceTax: form.serviceTax.trim() || null,
    panNumber: form.panNumber.trim().toUpperCase(),
    tdsRateSection: form.tdsRateSection.trim() || null,
    beneficiaryName: form.beneficiaryName.trim(),
    accountNumber: form.accountNumber.trim(),
    IFSCcode: form.IFSCcode.trim().toUpperCase(),
    branchName: form.branchName.trim(),
    notes: form.notes.trim() || null,
  };
}

export default function VendorOnboardingPage(): JSX.Element {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(blank);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]): void =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleContinue = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const err = validate(form);
    if (err) {
      toastError(err);
      return;
    }
    const formData = normalize(form);
    navigate('/vendor-confirm', { state: { formData } });
  };

  const handleClear = (): void => setForm(blank);

  return (
    <SendoLegacyPage title="Vendor Onboarding">
      <form onSubmit={handleContinue} className="px-5 pb-5">
        <Section title="Basic Information">
          <Field label="Supplier Name" required>
            <input
              className="sendo-input"
              required
              value={form.supplierName}
              onChange={(e) => set('supplierName', e.target.value)}
            />
          </Field>
          <Field label="Vendor Site Code" required>
            <select
              className="sendo-select"
              required
              value={form.venderSiteCode}
              onChange={(e) => set('venderSiteCode', e.target.value as FormState['venderSiteCode'])}
            >
              <option value="">Select</option>
              <option value="Rental">Rental</option>
              <option value="Adhoc">Adhoc</option>
            </select>
          </Field>
          <Field label="Phone Number" required>
            <input
              className="sendo-input"
              required
              pattern="[0-9]{10}"
              value={form.phoneNumber}
              onChange={(e) => set('phoneNumber', e.target.value)}
            />
          </Field>
          <Field label="Email ID" required>
            <input
              type="email"
              className="sendo-input"
              required
              value={form.emailId}
              onChange={(e) => set('emailId', e.target.value)}
            />
          </Field>
        </Section>

        <Section title="Address Details">
          <Field label="Address Line 1" required>
            <textarea
              className="sendo-input min-h-[70px] resize-y"
              required
              value={form.addressLine1}
              onChange={(e) => set('addressLine1', e.target.value)}
            />
          </Field>
          <Field label="Address Line 2">
            <textarea
              className="sendo-input min-h-[70px] resize-y"
              value={form.addressLine2}
              onChange={(e) => set('addressLine2', e.target.value)}
            />
          </Field>
          <Field label="Town / City" required>
            <input
              className="sendo-input"
              required
              value={form.townCity}
              onChange={(e) => set('townCity', e.target.value)}
            />
          </Field>
          <Field label="State" required>
            <input
              className="sendo-input"
              required
              value={form.state}
              onChange={(e) => set('state', e.target.value)}
            />
          </Field>
          <Field label="Pin Code" required>
            <input
              className="sendo-input"
              required
              pattern="[0-9]{6}"
              value={form.pinCode}
              onChange={(e) => set('pinCode', e.target.value)}
            />
          </Field>
        </Section>

        <Section title="Tax & Legal Information">
          <Field label="Service Registration Number (GST)" required>
            <input
              className="sendo-input"
              required
              value={form.serviceRegistrationNumber}
              onChange={(e) => set('serviceRegistrationNumber', e.target.value)}
            />
          </Field>
          <Field label="Service Tax Rate (if any)">
            <input
              className="sendo-input"
              value={form.serviceTax}
              onChange={(e) => set('serviceTax', e.target.value)}
            />
          </Field>
          <Field label="PAN Number" required>
            <input
              className="sendo-input"
              required
              pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
              value={form.panNumber}
              onChange={(e) => set('panNumber', e.target.value.toUpperCase())}
            />
          </Field>
          <Field label="TDS Rate & Section (if any)">
            <input
              className="sendo-input"
              value={form.tdsRateSection}
              onChange={(e) => set('tdsRateSection', e.target.value)}
            />
          </Field>
        </Section>

        <Section title="Notes (optional)">
          <Field label="Internal remarks" full>
            <textarea
              className="sendo-input min-h-[70px] resize-y"
              placeholder="Payment terms, category, etc."
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
            />
          </Field>
        </Section>

        <Section title="Bank Details">
          <Field label="Beneficiary Name (as on Cheque/Passbook)" required>
            <input
              className="sendo-input"
              required
              value={form.beneficiaryName}
              onChange={(e) => set('beneficiaryName', e.target.value)}
            />
          </Field>
          <Field label="Account Number" required>
            <input
              className="sendo-input"
              required
              value={form.accountNumber}
              onChange={(e) => set('accountNumber', e.target.value)}
            />
          </Field>
          <Field label="IFSC Code" required>
            <input
              className="sendo-input"
              required
              pattern="[A-Z]{4}0[A-Z0-9]{6}"
              value={form.IFSCcode}
              onChange={(e) => set('IFSCcode', e.target.value.toUpperCase())}
            />
          </Field>
          <Field label="Branch Name" required>
            <input
              className="sendo-input"
              required
              value={form.branchName}
              onChange={(e) => set('branchName', e.target.value)}
            />
          </Field>
        </Section>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="sendo-btn-black" onClick={handleClear}>
            Clear
          </button>
          <button type="submit" className="sendo-btn-yellow">
            Continue
          </button>
        </div>
      </form>
    </SendoLegacyPage>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }): JSX.Element {
  return (
    <div className="mb-6">
      <div className="font-bold text-sm border-b-2 border-yellow-400 pb-1 mb-4 mt-2 uppercase">
        {title}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">{children}</div>
    </div>
  );
}

function Field({
  label,
  required,
  full,
  children,
}: {
  label: string;
  required?: boolean;
  full?: boolean;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div className={full ? 'col-span-full' : ''}>
      <label className="sendo-label">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      {children}
    </div>
  );
}
