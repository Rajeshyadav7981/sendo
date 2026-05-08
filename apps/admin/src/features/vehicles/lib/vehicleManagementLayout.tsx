import type { CSSProperties } from 'react';

export const VM_SIDEBAR_GUTTER_PX = 278;

interface VmPageShellOptions {
  marginRightPx?: number;
}

export function vmPageShell(isMobile: boolean, options: VmPageShellOptions = {}): CSSProperties {
  const marginRightPx = options.marginRightPx ?? 0;
  if (isMobile) {
    return {
      boxSizing: 'border-box',
      marginLeft: 0,
      marginRight: 0,
      width: '100%',
      maxWidth: '100%',
      minWidth: 0,
      overflowX: 'hidden',
      position: 'relative',
      zIndex: 1,
    };
  }
  const L = VM_SIDEBAR_GUTTER_PX;
  const R = marginRightPx;
  const totalGutter = L + R;
  return {
    boxSizing: 'border-box',
    marginLeft: L,
    marginRight: R,
    width: `calc(100% - ${totalGutter}px)`,
    maxWidth: `calc(100% - ${totalGutter}px)`,
    minWidth: 0,
    overflowX: 'hidden',
    position: 'relative',
    zIndex: 1,
  };
}

export const vmTableScrollWrap: CSSProperties = {
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  overflowX: 'auto',
  WebkitOverflowScrolling: 'touch',
  boxSizing: 'border-box',
  border: '1px solid #e2e2e2',
  borderRadius: '8px',
  backgroundColor: '#fff',
};

const vmRecordTable: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  borderSpacing: 0,
  tableLayout: 'auto',
  fontSize: '13px',
};

const vmRecordTh: CSSProperties = {
  backgroundColor: '#FFC107',
  color: '#000',
  padding: '11px 12px',
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '0.02em',
  textAlign: 'left',
  borderBottom: '2px solid #e0a800',
  whiteSpace: 'nowrap',
  verticalAlign: 'middle',
  position: 'sticky',
  top: 0,
  zIndex: 2,
};

const vmRecordTd: CSSProperties = {
  padding: '10px 12px',
  fontSize: '13px',
  color: '#111',
  borderBottom: '1px solid #e8e8e8',
  verticalAlign: 'middle',
  whiteSpace: 'nowrap',
};

export function vmRecordRowBg(index: number): string {
  return index % 2 === 0 ? '#ffffff' : '#f9f9f9';
}

const VM_MOBILE_COL_PX = 88;

export function getVmRecordTableStyle(isMobile: boolean, columnCount?: number): CSSProperties {
  const base = { ...vmRecordTable };
  if (!isMobile) return base;
  const n = typeof columnCount === 'number' && columnCount > 0 ? Math.round(columnCount) : 10;
  const w = n * VM_MOBILE_COL_PX;
  return {
    ...base,
    tableLayout: 'fixed',
    width: `${w}px`,
    minWidth: `${w}px`,
    fontSize: '12px',
    borderCollapse: 'collapse',
  };
}

export function getVmRecordThStyle(isMobile: boolean): CSSProperties {
  return {
    ...vmRecordTh,
    ...(isMobile
      ? {
          padding: '8px 8px',
          fontSize: '11px',
          lineHeight: 1.25,
          boxSizing: 'border-box',
          letterSpacing: 'normal',
          textAlign: 'left',
          whiteSpace: 'normal',
          wordBreak: 'break-word',
          verticalAlign: 'top',
          minWidth: 0,
          position: 'static' as const,
          top: 'auto',
          zIndex: 'auto' as unknown as number,
        }
      : {}),
  };
}

export function getVmRecordTdStyle(isMobile: boolean): CSSProperties {
  return {
    ...vmRecordTd,
    ...(isMobile
      ? {
          padding: '8px 8px',
          fontSize: '11px',
          lineHeight: 1.25,
          boxSizing: 'border-box',
          textAlign: 'left',
          whiteSpace: 'normal',
          wordBreak: 'break-word',
          verticalAlign: 'top',
          minWidth: 0,
        }
      : {}),
  };
}

export function VmColGroup({ columnCount }: { columnCount: number }): JSX.Element | null {
  if (!columnCount || columnCount < 1) return null;
  const px = VM_MOBILE_COL_PX;
  return (
    <colgroup>
      {Array.from({ length: columnCount }, (_, i) => (
        <col key={i} style={{ width: `${px}px`, minWidth: `${px}px` }} />
      ))}
    </colgroup>
  );
}
