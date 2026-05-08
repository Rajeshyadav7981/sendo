import { useLocation, useNavigate } from 'react-router-dom';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';
import { toastError } from '@shared/lib/toast';
import { useCreateVendor } from '../vendors.hooks';
import type { CreateVendorBody } from '../vendors.api';

interface LocationState {
  formData?: CreateVendorBody;
}

const FIELDS: ReadonlyArray<readonly [keyof CreateVendorBody, string]> = [
  ['supplierName', 'Supplier Name'],
  ['venderSiteCode', 'Vendor Site Code'],
  ['phoneNumber', 'Phone Number'],
  ['emailId', 'Email ID'],
  ['addressLine1', 'Address Line 1'],
  ['addressLine2', 'Address Line 2'],
  ['townCity', 'Town / City'],
  ['state', 'State'],
  ['pinCode', 'Pin Code'],
  ['serviceRegistrationNumber', 'Service Registration Number'],
  ['serviceTax', 'Service Tax'],
  ['panNumber', 'PAN Number'],
  ['tdsRateSection', 'TDS Rate & Section'],
  ['beneficiaryName', 'Beneficiary Name'],
  ['accountNumber', 'Account Number'],
  ['IFSCcode', 'IFSC Code'],
  ['branchName', 'Branch Name'],
  ['notes', 'Notes'],
];

export default function VendorConfirmationPage(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const create = useCreateVendor();
  const formData = (location.state as LocationState | null)?.formData;

  const handleSubmit = (): void => {
    if (!formData?.supplierName) {
      toastError('No vendor data to submit. Go back and complete the form.');
      return;
    }
    create.mutate(formData, {
      onSuccess: () => navigate('/vendor-management'),
    });
  };

  if (!formData) {
    return (
      <SendoLegacyPage title="Confirm Vendor Details">
        <div className="px-5 py-8">
          <p className="text-gray-600">No vendor data found. Please complete onboarding first.</p>
          <button
            type="button"
            className="sendo-btn-yellow mt-4"
            onClick={() => navigate('/vendor-onboarding')}
          >
            Go to Vendor Onboarding
          </button>
        </div>
      </SendoLegacyPage>
    );
  }

  return (
    <SendoLegacyPage title="Confirm Vendor Details">
      <div className="px-5 pb-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
          {FIELDS.map(([key, label]) => (
            <div key={key}>
              <label className="sendo-label">{label}</label>
              <input
                type="text"
                className="sendo-input bg-gray-50"
                value={(formData[key] as string | null | undefined) ?? ''}
                readOnly
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" className="sendo-btn-outline" onClick={() => navigate(-1)}>
            Back
          </button>
          <button
            type="button"
            className="sendo-btn-yellow"
            disabled={create.isPending}
            onClick={handleSubmit}
          >
            {create.isPending ? 'Saving…' : 'Submit'}
          </button>
        </div>
      </div>
    </SendoLegacyPage>
  );
}
