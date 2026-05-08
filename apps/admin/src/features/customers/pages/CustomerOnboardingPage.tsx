import { type ChangeEvent, type CSSProperties, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';
import { toastError } from '@shared/lib/toast';
import type { CustomerInput } from '../customers.api';

const styles: Record<string, CSSProperties> = {
  formWrapper: { padding: '24px 20px' },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: '15px',
    color: '#000',
    borderBottom: '2px solid #FFC107',
    paddingBottom: '6px',
    marginBottom: '16px',
    marginTop: '10px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '24px',
  },
  label: {
    fontWeight: 'bold',
    fontSize: '14px',
    marginBottom: '6px',
    display: 'block',
    color: '#000',
  },
  input: {
    width: '100%',
    padding: '9px 10px',
    border: '1.5px solid #000',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box',
    color: '#000',
    backgroundColor: '#fff',
    outline: 'none',
  },
  buttonRow: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    paddingBottom: '10px',
  },
  btnBlack: {
    padding: '9px 28px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: 'black',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  btnYellow: {
    padding: '9px 28px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: '#FFC107',
    color: 'black',
    fontWeight: 'bold',
    fontSize: '14px',
  },
};

const blank: CustomerInput = {
  companyName: '',
  address: '',
  pointOfContact: '',
  state: '',
  phoneNumber: '',
  emailId: '',
  gstNumber: '',
  rateCard: '',
};

const ALPHANUM = /^[a-zA-Z0-9 ]+$/;
const ALPHA = /^[a-zA-Z ]+$/;
const PHONE = /^[0-9]{10}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GST = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
const RATE = /^[0-9]+(\.[0-9]{1,2})?$/;

export default function CustomerOnboardingPage(): JSX.Element {
  const navigate = useNavigate();
  const [form, setForm] = useState<CustomerInput>(blank);

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleClear = (): void => setForm(blank);

  const validate = (): boolean => {
    if (!ALPHANUM.test(form.companyName)) {
      toastError('Company Name should be alphanumeric.');
      return false;
    }
    if (!ALPHA.test(form.pointOfContact)) {
      toastError('Point of Contact should contain only alphabets.');
      return false;
    }
    if (!ALPHA.test(form.state)) {
      toastError('State should contain only alphabets.');
      return false;
    }
    if (!PHONE.test(form.phoneNumber)) {
      toastError('Phone Number should be a 10-digit numeric value.');
      return false;
    }
    if (!EMAIL.test(form.emailId)) {
      toastError('Please enter a valid email address.');
      return false;
    }
    if (!GST.test(form.gstNumber)) {
      toastError('Please enter a valid GST number.');
      return false;
    }
    if (!RATE.test(form.rateCard)) {
      toastError('Rate Card should be a valid number.');
      return false;
    }
    return true;
  };

  const handleContinue = (): void => {
    if (validate()) {
      navigate('/customer-confirm', { state: { formData: form } });
    }
  };

  return (
    <SendoLegacyPage title="CUSTOMER ONBOARDING">
        <div style={styles.sectionTitle}>Company Information</div>
        <div style={styles.formGrid}>
          <div>
            <label style={styles.label}>Company Name:</label>
            <input style={styles.input} type="text" name="companyName"
              value={form.companyName} onChange={onChange} required />
          </div>
          <div>
            <label style={styles.label}>Point of Contact:</label>
            <input style={styles.input} type="text" name="pointOfContact"
              value={form.pointOfContact} onChange={onChange} required />
          </div>
          <div>
            <label style={styles.label}>Phone Number:</label>
            <input style={styles.input} type="text" name="phoneNumber"
              value={form.phoneNumber} onChange={onChange} required />
          </div>
          <div>
            <label style={styles.label}>Email ID:</label>
            <input style={styles.input} type="email" name="emailId"
              value={form.emailId} onChange={onChange} required />
          </div>
          <div>
            <label style={styles.label}>State:</label>
            <input style={styles.input} type="text" name="state"
              value={form.state} onChange={onChange} required />
          </div>
          <div>
            <label style={styles.label}>Rate Card:</label>
            <input style={styles.input} type="text" name="rateCard"
              value={form.rateCard} onChange={onChange} required />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={styles.label}>Address:</label>
            <textarea name="address"
              style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
              value={form.address} onChange={onChange} required />
          </div>
        </div>

        <div style={styles.sectionTitle}>Tax Information</div>
        <div style={styles.formGrid}>
          <div>
            <label style={styles.label}>GST Number:</label>
            <input style={styles.input} type="text" name="gstNumber"
              value={form.gstNumber} onChange={onChange} required />
          </div>
        </div>

        <div style={styles.buttonRow}>
          <button type="button" style={styles.btnBlack} onClick={handleClear}>Clear</button>
          <button type="button" style={styles.btnYellow} onClick={handleContinue}>Continue</button>
        </div>
    </SendoLegacyPage>
  );
}
