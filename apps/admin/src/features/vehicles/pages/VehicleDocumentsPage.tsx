import { type CSSProperties, useEffect, useMemo, useState } from 'react';
import { Modal, Table, Tag } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { DatePicker } from '@shared/components/ui/DatePicker';
import { useDebounce } from '@shared/hooks/useDebounce';
import {
  getVmRecordTableStyle,
  getVmRecordTdStyle,
  getVmRecordThStyle,
  vmPageShell,
  vmTableScrollWrap,
} from '../lib/vehicleManagementLayout';
import {
  useDocuments,
  useRenewDocument,
  vehiclesKeys,
} from '../vehicles.hooks';
import {
  vehiclesApi,
  type DocStatus,
  type DocumentRow,
  type ListDocumentsQuery,
} from '../vehicles.api';

const MONTHS = [
  { value: '', label: 'All Months' },
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const YEARS = ['', ...Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() - 3 + i))];

const STATUS_OPTIONS = ['', 'Valid', 'Expiring', 'Expired'];

const DOC_TYPE_OPTIONS = [
  '',
  'RC Book',
  'Insurance',
  'PUC',
  'Road Tax',
  'Fitness Certificate',
  'National Permit',
  'State Permit',
  'Temporary Permit',
];

const C = {
  yellow: '#FFC107',
  black: '#000000',
  white: '#ffffff',
  border: '1.5px solid #000000',
  radius: '4px',
  fontFamily: 'Arial, sans-serif',
  fontSize: '14px',
  fontSizeSm: '13px',
};

function status(expiry: string | null): 'Valid' | 'Expiring' | 'Expired' | '—' {
  if (!expiry) return '—';
  const d = new Date(expiry).getTime();
  const now = Date.now();
  if (!Number.isFinite(d)) return '—';
  if (d < now) return 'Expired';
  if (d - now < 30 * 86400 * 1000) return 'Expiring';
  return 'Valid';
}

function statusColor(s: string): string {
  if (s === 'Expired') return 'red';
  if (s === 'Expiring') return 'orange';
  if (s === 'Valid') return 'green';
  return 'default';
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—';
  const t = new Date(d);
  return Number.isNaN(t.getTime()) ? '—' : t.toLocaleDateString('en-IN');
}

export default function VehicleDocumentsPage(): JSX.Element {
  const renew = useRenewDocument();
  const [target, setTarget] = useState<DocumentRow | null>(null);
  const [historyTarget, setHistoryTarget] = useState<DocumentRow | null>(null);

  const [documentNumber, setDocumentNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [issuingAuthority, setIssuingAuthority] = useState('');
  const [remarks, setRemarks] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [filterDocType, setFilterDocType] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchText, setSearchText] = useState('');
  const debouncedSearch = useDebounce(searchText, 300);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const [isMobile, setIsMobile] = useState(() =>
    typeof window === 'undefined' ? false : window.innerWidth <= 768,
  );

  useEffect(() => {
    const h = (): void => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [filterDocType, filterMonth, filterYear, filterStatus, debouncedSearch]);

  const docsQuery: ListDocumentsQuery = {
    documentType: filterDocType || undefined,
    status: (filterStatus as DocStatus) || undefined,
    year: filterYear ? Number(filterYear) : undefined,
    month: filterMonth ? Number(filterMonth) : undefined,
    q: debouncedSearch.trim() || undefined,
    page,
    limit: pageSize,
    sort: 'expiry',
    order: 'asc',
  };

  const { data, isLoading, isFetching } = useDocuments(docsQuery);

  const history = useQuery({
    queryKey: historyTarget
      ? [
          ...vehiclesKeys.documents(),
          'history',
          historyTarget.vehicleNumber,
          historyTarget.documentKey,
        ]
      : ['noop'],
    queryFn: () =>
      vehiclesApi.documentHistory(historyTarget!.vehicleNumber, historyTarget!.documentKey),
    enabled: !!historyTarget,
  });

  const items = Array.isArray(data) ? data : data?.items ?? [];
  const total = Array.isArray(data) ? data.length : data?.total ?? 0;

  const docTypes = useMemo(() => DOC_TYPE_OPTIONS.filter((t) => t !== ''), []);

  const reset = (): void => {
    setTarget(null);
    setDocumentNumber('');
    setIssueDate('');
    setExpiryDate('');
    setIssuingAuthority('');
    setRemarks('');
    setFile(null);
  };

  const onRenew = (): void => {
    if (!target) return;
    const fd = new FormData();
    fd.append('vehicleNumber', target.vehicleNumber);
    fd.append('documentKey', target.documentKey);
    if (documentNumber) fd.append('documentNumber', documentNumber);
    if (issueDate) fd.append('issueDate', issueDate);
    if (expiryDate) fd.append('expiryDate', expiryDate);
    if (issuingAuthority) fd.append('issuingAuthority', issuingAuthority);
    if (remarks) fd.append('remarks', remarks);
    if (file) fd.append('documentFile', file);
    renew.mutate(fd, { onSuccess: reset });
  };

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
    filterWrapper: { padding: isMobile ? '14px' : '20px' },
    filterRow: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '10px',
      alignItems: 'center',
    },
    select: {
      padding: '9px 10px',
      border: C.border,
      borderRadius: C.radius,
      fontSize: C.fontSize,
      color: C.black,
      backgroundColor: C.white,
      fontFamily: C.fontFamily,
      minWidth: '140px',
    },
    searchInput: {
      flex: '1 1 240px',
      maxWidth: '320px',
      padding: '9px 12px',
      border: C.border,
      borderRadius: C.radius,
      fontSize: C.fontSize,
      color: C.black,
      fontFamily: C.fontFamily,
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
      color: C.black,
      backgroundColor: C.white,
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
    rowActionPrimary: {
      padding: '5px 12px',
      backgroundColor: C.yellow,
      color: C.black,
      border: 'none',
      borderRadius: C.radius,
      cursor: 'pointer',
      fontWeight: 'bold',
      fontSize: '12px',
      fontFamily: C.fontFamily,
    },
    rowActionGhost: {
      padding: '5px 12px',
      backgroundColor: C.white,
      color: C.black,
      border: C.border,
      borderRadius: C.radius,
      cursor: 'pointer',
      fontWeight: 'bold',
      fontSize: '12px',
      fontFamily: C.fontFamily,
    },
    table: getVmRecordTableStyle(isMobile, 12),
    th: getVmRecordThStyle(isMobile),
    td: { ...getVmRecordTdStyle(isMobile), color: C.black },
    tableWrap: { ...vmTableScrollWrap, margin: isMobile ? '0 14px 14px' : '0 20px 20px' },
  };

  return (
    <div style={S.container}>
      <div style={S.pageHeader}>VEHICLE DOCUMENTS</div>

      <div style={S.filterWrapper}>
        <div style={S.filterRow}>
          <select
            style={S.select}
            value={filterDocType}
            onChange={(e) => setFilterDocType(e.target.value)}
          >
            <option value="">All documents</option>
            {docTypes.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            style={S.select}
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <select
            style={S.select}
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y || 'All Years'}
              </option>
            ))}
          </select>
          <select
            style={S.select}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s || 'All Status'}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Search…"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={S.searchInput}
          />
          <span style={{ fontSize: '12px', color: '#666' }}>
            {items.length} of {total}
          </span>
        </div>
      </div>

      <div style={S.tableWrap}>
        <Table<DocumentRow>
          rowKey={(row) => `${row.vehicleNumber}-${row.documentKey}`}
          loading={isLoading || isFetching}
          dataSource={items}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: ['25', '50', '100', '200'],
            showTotal: (t, range) => `${range[0]}–${range[1]} of ${t}`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
          scroll={{ x: 'max-content' }}
          columns={[
            {
              title: 'Vehicle',
              dataIndex: 'vehicleNumber',
              render: (v: string) => <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{v}</span>,
            },
            { title: 'Owner', dataIndex: 'registerName' },
            { title: 'Document', dataIndex: 'documentType' },
            { title: 'Number', dataIndex: 'documentNumber' },
            {
              title: 'Issue',
              dataIndex: 'issueDate',
              render: (d: string | null) => fmtDate(d),
            },
            {
              title: 'Expiry',
              dataIndex: 'expiryDate',
              render: (d: string | null) => fmtDate(d),
            },
            {
              title: 'Status',
              render: (_: unknown, row: DocumentRow) => {
                const s = status(row.expiryDate);
                return <Tag color={statusColor(s)}>{s}</Tag>;
              },
            },
            { title: 'Authority', dataIndex: 'issuingAuthority' },
            {
              title: 'File',
              dataIndex: 'fileUrl',
              render: (u: string | null) =>
                u ? (
                  <a
                    href={u}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#0000ee', textDecoration: 'underline' }}
                  >
                    View
                  </a>
                ) : (
                  <Tag>none</Tag>
                ),
            },
            { title: 'Versions', dataIndex: 'historyCount' },
            {
              title: 'Action',
              render: (_: unknown, row: DocumentRow) => (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    style={S.rowActionPrimary}
                    onClick={() => setTarget(row)}
                  >
                    Renew
                  </button>
                  {row.historyCount > 0 && (
                    <button
                      type="button"
                      style={S.rowActionGhost}
                      onClick={() => setHistoryTarget(row)}
                    >
                      History
                    </button>
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>

      <Modal
        open={!!target}
        title={target ? `Renew ${target.documentType} — ${target.vehicleNumber}` : ''}
        onCancel={reset}
        footer={null}
        styles={{ header: { backgroundColor: C.yellow, padding: '14px 20px' } }}
      >
        {target && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: '14px',
            }}
          >
            <div>
              <label style={S.label}>Document number</label>
              <input
                style={S.input}
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
              />
            </div>
            <div>
              <label style={S.label}>Issue date</label>
              <DatePicker value={issueDate} onChange={setIssueDate} />
            </div>
            <div>
              <label style={S.label}>Expiry date</label>
              <DatePicker value={expiryDate} onChange={setExpiryDate} />
            </div>
            <div>
              <label style={S.label}>Issuing authority</label>
              <input
                style={S.input}
                value={issuingAuthority}
                onChange={(e) => setIssuingAuthority(e.target.value)}
              />
            </div>
            <div style={{ gridColumn: isMobile ? 'auto' : '1 / span 2' }}>
              <label style={S.label}>Remarks</label>
              <input
                style={S.input}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
            <div style={{ gridColumn: isMobile ? 'auto' : '1 / span 2' }}>
              <label style={S.label}>Document file</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                style={{ fontSize: '13px' }}
              />
            </div>
            <div
              style={{
                gridColumn: isMobile ? 'auto' : '1 / span 2',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                flexWrap: 'wrap',
                marginTop: '8px',
              }}
            >
              <button type="button" style={S.btnBlack} onClick={reset} disabled={renew.isPending}>
                Cancel
              </button>
              <button
                type="button"
                style={{ ...S.btnYellow, opacity: renew.isPending ? 0.7 : 1 }}
                onClick={onRenew}
                disabled={renew.isPending || (!file && !expiryDate)}
              >
                {renew.isPending ? 'Saving...' : 'Save Renewal'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!historyTarget}
        title={
          historyTarget
            ? `History — ${historyTarget.documentType} — ${historyTarget.vehicleNumber}`
            : ''
        }
        onCancel={() => setHistoryTarget(null)}
        footer={null}
        width={800}
        styles={{ header: { backgroundColor: C.yellow, padding: '14px 20px' } }}
      >
        <Table
          rowKey={(_, i) => String(i ?? Math.random())}
          loading={history.isLoading}
          dataSource={(history.data ?? []) as Array<Record<string, unknown>>}
          pagination={false}
          columns={[
            {
              title: 'Issue',
              dataIndex: 'issueDate',
              render: (d) => fmtDate(typeof d === 'string' ? d : null),
            },
            {
              title: 'Expiry',
              dataIndex: 'expiryDate',
              render: (d) => fmtDate(typeof d === 'string' ? d : null),
            },
            { title: 'Number', dataIndex: 'documentNumber' },
            { title: 'Authority', dataIndex: 'issuingAuthority' },
            { title: 'Remarks', dataIndex: 'remarks' },
            {
              title: 'File',
              dataIndex: 'fileUrl',
              render: (u) =>
                typeof u === 'string' && u ? (
                  <a
                    href={u}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#0000ee', textDecoration: 'underline' }}
                  >
                    View
                  </a>
                ) : (
                  '—'
                ),
            },
          ]}
        />
      </Modal>
    </div>
  );
}
