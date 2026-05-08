import { type CSSProperties, useEffect, useState } from 'react';
import { vmPageShell } from './vehicleManagementLayout';

const C = {
  yellow: '#FFC107',
  black: '#000000',
  white: '#ffffff',
  border: '1.5px solid #000000',
  borderYellow: '2px solid #FFC107',
  radius: '4px',
  fontFamily: 'Arial, sans-serif',
  fontSize: '14px',
  fontSizeSm: '13px',
};

function humanize(k: string): string {
  return k.replace(/([A-Z])/g, ' $1').trim();
}

interface Props {
  title: string;
  formData: Record<string, unknown>;
  onBack: () => void;
  onSubmit: () => void;
  isPending: boolean;
  imageKeys?: string[];
}

export function VmConfirmationShell({
  title,
  formData,
  onBack,
  onSubmit,
  isPending,
  imageKeys = [],
}: Props): JSX.Element {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === 'undefined' ? false : window.innerWidth <= 768,
  );

  useEffect(() => {
    const h = (): void => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const S: Record<string, CSSProperties> = {
    container: {
      ...vmPageShell(isMobile),
      fontFamily: C.fontFamily,
      backgroundColor: C.white,
      color: C.black,
      minHeight: 'calc(100vh - 70px)',
      boxShadow: '0px 4px 8px rgba(0,0,0,0.1)',
    },
    pageHeader: {
      backgroundColor: C.yellow,
      color: C.black,
      padding: '16px 20px',
      fontWeight: 'bold',
      fontSize: '20px',
      letterSpacing: '1px',
      textTransform: 'uppercase',
    },
    body: { padding: isMobile ? '14px' : '20px' },
    sectionTitle: {
      fontWeight: 'bold',
      fontSize: C.fontSizeSm,
      color: C.black,
      borderBottom: C.borderYellow,
      paddingBottom: '6px',
      marginBottom: '16px',
      marginTop: '4px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '16px',
      marginBottom: '16px',
    },
    label: {
      fontWeight: 'bold',
      fontSize: C.fontSizeSm,
      marginBottom: '5px',
      display: 'block',
      color: C.black,
    },
    input: {
      width: '100%',
      padding: '9px 10px',
      border: C.border,
      borderRadius: C.radius,
      fontSize: isMobile ? '16px' : C.fontSize,
      boxSizing: 'border-box',
      color: '#555',
      backgroundColor: '#f9f9f9',
      outline: 'none',
      fontFamily: C.fontFamily,
    },
    btnYellow: {
      padding: '9px 28px',
      border: 'none',
      borderRadius: C.radius,
      cursor: 'pointer',
      backgroundColor: C.yellow,
      color: C.black,
      fontWeight: 'bold',
      fontSize: C.fontSize,
      fontFamily: C.fontFamily,
    },
    btnBlack: {
      padding: '9px 28px',
      border: 'none',
      borderRadius: C.radius,
      cursor: 'pointer',
      backgroundColor: C.black,
      color: C.white,
      fontWeight: 'bold',
      fontSize: C.fontSize,
      fontFamily: C.fontFamily,
    },
    actions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px',
      flexWrap: 'wrap',
      marginTop: '20px',
    },
    emptyMsg: {
      padding: '40px 20px',
      textAlign: 'center',
      color: '#888',
    },
  };

  if (Object.keys(formData).length === 0) {
    return (
      <div style={S.container}>
        <div style={S.pageHeader}>{title}</div>
        <div style={S.emptyMsg}>No data.</div>
      </div>
    );
  }

  return (
    <div style={S.container}>
      <div style={S.pageHeader}>{title}</div>

      <div style={S.body}>
        <div style={S.sectionTitle}>Review</div>
        <div style={S.grid}>
          {Object.entries(formData).map(([k, v]) => {
            const isImage =
              imageKeys.includes(k) && typeof v === 'string' && v.startsWith('data:image');
            return (
              <div key={k}>
                <label style={S.label}>{humanize(k)}:</label>
                {isImage ? (
                  <img
                    src={String(v)}
                    alt={k}
                    style={{
                      maxHeight: '224px',
                      borderRadius: C.radius,
                      border: '1px solid #ccc',
                    }}
                  />
                ) : (
                  <input style={S.input} value={String(v ?? '')} readOnly />
                )}
              </div>
            );
          })}
        </div>

        <div style={S.actions}>
          <button type="button" style={S.btnBlack} onClick={onBack}>
            Back
          </button>
          <button
            type="button"
            style={{ ...S.btnYellow, opacity: isPending ? 0.7 : 1 }}
            onClick={onSubmit}
            disabled={isPending}
          >
            {isPending ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}
