import { type CSSProperties } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';
import { useCreateCustomer } from '../customers.hooks';
import type { CustomerInput } from '../customers.api';

const containerStyle: CSSProperties = {
  width: '800px',
  height: 'auto',
  margin: 'auto',
  padding: '20px',
  border: '1px solid #ccc',
  borderRadius: '8px',
  backgroundColor: '#f9f9f9',
};

const buttonRow: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '2rem',
  paddingTop: '4rem',
};

const labelStyle: CSSProperties = { fontWeight: 'bold' };

const buttonStyle: CSSProperties = {
  backgroundColor: 'black',
  color: 'white',
  padding: '10px 15px',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontSize: '16px',
};

interface LocationState {
  formData?: CustomerInput;
}

export default function CustomerConfirmationPage(): JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const create = useCreateCustomer();
  const formData = (location.state as LocationState | null)?.formData;

  const handleSubmit = (): void => {
    if (!formData) return;
    create.mutate(formData, {
      onSuccess: () => navigate('/customer-management'),
    });
  };

  return (
    <SendoLegacyPage title="Confirm Customer Details">
      <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        <div style={containerStyle}>
          <h2>Confirm Customer Details</h2>
          {formData ? (
            <>
              <p><span style={labelStyle}>Company Name:</span> {formData.companyName}</p>
              <p><span style={labelStyle}>Address:</span> {formData.address}</p>
              <p><span style={labelStyle}>Point of Contact:</span> {formData.pointOfContact}</p>
              <p><span style={labelStyle}>State:</span> {formData.state}</p>
              <p><span style={labelStyle}>Phone Number:</span> {formData.phoneNumber}</p>
              <p><span style={labelStyle}>Mail ID:</span> {formData.emailId}</p>
              <p><span style={labelStyle}>GST Number:</span> {formData.gstNumber}</p>
              <p><span style={labelStyle}>Rate Card:</span> {formData.rateCard}</p>
            </>
          ) : (
            <p>No data — go back and fill the onboarding form.</p>
          )}
          <div style={buttonRow}>
            <button type="button" style={buttonStyle} onClick={() => navigate(-1)}>Back</button>
            <button
              type="button"
              style={buttonStyle}
              disabled={!formData || create.isPending}
              onClick={handleSubmit}
            >
              {create.isPending ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </SendoLegacyPage>
  );
}
