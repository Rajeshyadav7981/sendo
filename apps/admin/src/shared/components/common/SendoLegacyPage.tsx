import { type CSSProperties, type ReactNode, useEffect, useState } from 'react';
import { vmPageShell } from '@features/vehicles/lib/vehicleManagementLayout';

const FONT_FAMILY = 'Arial, sans-serif';

interface SendoLegacyPageProps {
  title: string;
  toolbar?: ReactNode;
  children: ReactNode;
  noBodyPadding?: boolean;
}

export function SendoLegacyPage({
  title,
  toolbar,
  children,
  noBodyPadding,
}: SendoLegacyPageProps): JSX.Element {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === 'undefined' ? false : window.innerWidth <= 768,
  );

  useEffect(() => {
    const h = (): void => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const container: CSSProperties = {
    ...vmPageShell(isMobile),
    fontFamily: FONT_FAMILY,
    backgroundColor: '#ffffff',
    color: '#000000',
    minHeight: 'calc(100vh - 70px)',
    boxShadow: '0px 4px 8px rgba(0,0,0,0.1)',
  };

  const header: CSSProperties = {
    backgroundColor: '#FFC107',
    color: '#000000',
    padding: '16px 20px',
    fontWeight: 'bold',
    fontSize: '20px',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
  };

  const body: CSSProperties = {
    padding: noBodyPadding ? 0 : isMobile ? '14px' : '20px',
  };

  return (
    <div style={container}>
      <div style={header}>
        <span>{title}</span>
        {toolbar ? <span style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>{toolbar}</span> : null}
      </div>
      <div style={body}>{children}</div>
    </div>
  );
}

export const sendoLegacyTokens = {
  yellow: '#FFC107',
  black: '#000000',
  white: '#ffffff',
  border: '1.5px solid #000000',
  borderYellow: '2px solid #FFC107',
  radius: '4px',
  fontFamily: FONT_FAMILY,
  fontSize: '14px',
  fontSizeSm: '13px',
};

export const sendoLegacyControlStyles = {
  input: {
    width: '100%',
    padding: '9px 10px',
    border: sendoLegacyTokens.border,
    borderRadius: sendoLegacyTokens.radius,
    fontSize: sendoLegacyTokens.fontSize,
    boxSizing: 'border-box',
    color: sendoLegacyTokens.black,
    backgroundColor: sendoLegacyTokens.white,
    outline: 'none',
    fontFamily: sendoLegacyTokens.fontFamily,
  } as CSSProperties,
  select: {
    padding: '9px 10px',
    border: sendoLegacyTokens.border,
    borderRadius: sendoLegacyTokens.radius,
    fontSize: sendoLegacyTokens.fontSize,
    color: sendoLegacyTokens.black,
    backgroundColor: sendoLegacyTokens.white,
    fontFamily: sendoLegacyTokens.fontFamily,
    minWidth: '140px',
  } as CSSProperties,
  label: {
    fontWeight: 'bold',
    fontSize: sendoLegacyTokens.fontSizeSm,
    marginBottom: '5px',
    display: 'block',
    color: sendoLegacyTokens.black,
  } as CSSProperties,
  btnYellow: {
    padding: '9px 22px',
    border: 'none',
    borderRadius: sendoLegacyTokens.radius,
    cursor: 'pointer',
    backgroundColor: sendoLegacyTokens.yellow,
    color: sendoLegacyTokens.black,
    fontWeight: 'bold',
    fontSize: sendoLegacyTokens.fontSize,
    fontFamily: sendoLegacyTokens.fontFamily,
  } as CSSProperties,
  btnBlack: {
    padding: '9px 22px',
    border: 'none',
    borderRadius: sendoLegacyTokens.radius,
    cursor: 'pointer',
    backgroundColor: sendoLegacyTokens.black,
    color: sendoLegacyTokens.white,
    fontWeight: 'bold',
    fontSize: sendoLegacyTokens.fontSize,
    fontFamily: sendoLegacyTokens.fontFamily,
  } as CSSProperties,
  btnGhost: {
    padding: '9px 22px',
    backgroundColor: sendoLegacyTokens.white,
    color: sendoLegacyTokens.black,
    border: sendoLegacyTokens.border,
    borderRadius: sendoLegacyTokens.radius,
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: sendoLegacyTokens.fontSize,
    fontFamily: sendoLegacyTokens.fontFamily,
  } as CSSProperties,
  rowActionPrimary: {
    padding: '5px 12px',
    backgroundColor: sendoLegacyTokens.yellow,
    color: sendoLegacyTokens.black,
    border: 'none',
    borderRadius: sendoLegacyTokens.radius,
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '12px',
    fontFamily: sendoLegacyTokens.fontFamily,
  } as CSSProperties,
  rowActionGhost: {
    padding: '5px 12px',
    backgroundColor: sendoLegacyTokens.white,
    color: sendoLegacyTokens.black,
    border: sendoLegacyTokens.border,
    borderRadius: sendoLegacyTokens.radius,
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '12px',
    fontFamily: sendoLegacyTokens.fontFamily,
  } as CSSProperties,
  rowActionDanger: {
    padding: '5px 12px',
    backgroundColor: '#dc2626',
    color: sendoLegacyTokens.white,
    border: 'none',
    borderRadius: sendoLegacyTokens.radius,
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '12px',
    fontFamily: sendoLegacyTokens.fontFamily,
  } as CSSProperties,
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: sendoLegacyTokens.fontSizeSm,
    color: sendoLegacyTokens.black,
    borderBottom: sendoLegacyTokens.borderYellow,
    paddingBottom: '6px',
    marginBottom: '16px',
    marginTop: '16px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  } as CSSProperties,
};
