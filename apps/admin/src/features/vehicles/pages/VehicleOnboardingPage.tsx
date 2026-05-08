import { type CSSProperties, type FormEvent, useEffect, useMemo, useState } from 'react';
import { saveAs } from 'file-saver';
import { config } from '@config/env';
import { DatePicker } from '@shared/components/ui/DatePicker';
import { toastError, toastSuccess } from '@shared/lib/toast';
import {
  getVmRecordTableStyle,
  getVmRecordTdStyle,
  getVmRecordThStyle,
  vmPageShell,
  vmRecordRowBg,
  vmTableScrollWrap,
  VmColGroup,
} from '../lib/vehicleManagementLayout';
import {
  useCreateVehicle,
  useDeleteVehicle,
  useUpdateSchedule,
  useUpdateVehicle,
  useVehicles,
} from '../vehicles.hooks';
import { vehiclesApi, type Vehicle } from '../vehicles.api';

const SCHEDULE_DEFAULTS: Record<string, { scheduleInterval: string; scheduleLitres: string; scheduleKmPerLitre: string }> = {
  'Pickup Truck': { scheduleInterval: '2', scheduleLitres: '40', scheduleKmPerLitre: '8' },
  '407 Truck':    { scheduleInterval: '2', scheduleLitres: '60', scheduleKmPerLitre: '6' },
  '17FT':         { scheduleInterval: '3', scheduleLitres: '80', scheduleKmPerLitre: '5' },
  '20FT':         { scheduleInterval: '3', scheduleLitres: '100', scheduleKmPerLitre: '4.5' },
  Truck:          { scheduleInterval: '3', scheduleLitres: '80', scheduleKmPerLitre: '5' },
  Bus:            { scheduleInterval: '2', scheduleLitres: '70', scheduleKmPerLitre: '5' },
  Car:            { scheduleInterval: '7', scheduleLitres: '40', scheduleKmPerLitre: '12' },
  Bike:           { scheduleInterval: '5', scheduleLitres: '10', scheduleKmPerLitre: '40' },
};

interface FormState {
  vehicleNumber: string;
  registerName: string;
  vehicleType: string;
  grossVehicleWeight: string;
  chassisNumber: string;
  engineNumber: string;
  fuelType: string;
  registrationDate: string;
  fitnessValidUpto: string;
  taxValidUpto: string;
  insuranceValidUpto: string;
  pollutionValidUpto: string;
  statePermit: 'Yes' | 'No';
  statePermitValidUpto: string;
  nationalPermit: 'Yes' | 'No';
  permitUpto: string;
  temporaryPermit: 'Yes' | 'No';
  TemporarypermitUpto: string;
  remarks: string;
  scheduleDate: string;
  scheduleInterval: string;
  scheduleLitres: string;
  scheduleKmPerLitre: string;
  scheduleKmPerFill: string;
  scheduleKmActual: string;
}

const emptyForm: FormState = {
  vehicleNumber: '', registerName: '', vehicleType: '', grossVehicleWeight: '',
  chassisNumber: '', engineNumber: '', fuelType: '',
  registrationDate: '', fitnessValidUpto: '', taxValidUpto: '', insuranceValidUpto: '',
  pollutionValidUpto: '',
  statePermit: 'No', statePermitValidUpto: '',
  nationalPermit: 'No', permitUpto: '',
  temporaryPermit: 'No', TemporarypermitUpto: '', remarks: '',
  scheduleDate: '', scheduleInterval: '', scheduleLitres: '',
  scheduleKmPerLitre: '', scheduleKmPerFill: '', scheduleKmActual: '',
};

const VEHICLE_ONBOARDING_RECORD_HEADERS = [
  'Vehicle No', 'Owner', 'Type', 'Chassis', 'Engine', 'Fuel', 'GVW',
  'Reg Date', 'Fitness', 'Tax', 'Insurance', 'Pollution',
  'State Permit', 'Nat. Permit', 'Permit Upto',
  'Sched Date', 'Interval', 'Litres/Fill', 'KM/Litre', 'KM/Fill', 'Odometer KM',
  'Remarks', 'RC', 'Insurance Doc', 'Pollution Doc', 'Road Tax', 'Fitness Doc', 'Permit Doc',
  'Schedule date history',
  'Edit Schedule', 'Actions',
];

const FILE_KEYS = [
  'RegistrationCertificate', 'Insurance', 'PollutionCertificate', 'RoadTax',
  'FitnessCertificate', 'Permit', 'StatePermit', 'TemporaryPermit',
] as const;
type FileKey = (typeof FILE_KEYS)[number];

interface ScheduleEdit {
  vehicleNumber: string;
  scheduleDate: string;
  scheduleInterval: string;
  scheduleLitres: string;
  scheduleKmPerLitre: string;
  scheduleKmPerFill: string;
  scheduleKmActual: string;
}

interface ScheduleHistoryEntry {
  _id?: string;
  scheduleDate?: string | null;
  changedAt?: string | null;
  source?: string | null;
}

interface ScheduleHistoryModal {
  vehicleNumber: string;
  currentScheduleDate: string | null;
  items: ScheduleHistoryEntry[];
}

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

function fmtDate(value: string | null | undefined): string {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN');
}

function fmtDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('en-IN');
}

function sameCalendarDay(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  const da = new Date(a);
  const db = new Date(b);
  if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return false;
  return da.toISOString().slice(0, 10) === db.toISOString().slice(0, 10);
}

function autoKmPerFill(litres: string, kmpl: string): string {
  const a = Number(litres);
  const b = Number(kmpl);
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) return '';
  return String(Math.round(a * b));
}

function dateOnly(d: unknown): string {
  if (typeof d !== 'string' || !d) return '';
  return d.slice(0, 10);
}

export default function VehicleOnboardingPage(): JSX.Element {
  const create = useCreateVehicle();
  const updateVehicleMutation = useUpdateVehicle();
  const deleteVehicle = useDeleteVehicle();
  const updateSchedule = useUpdateSchedule();
  const { data: vehicles = [], isLoading } = useVehicles();

  const [formData, setFormData] = useState<FormState>(emptyForm);
  const [documents, setDocuments] = useState<Record<FileKey, File | null>>({
    RegistrationCertificate: null, Insurance: null, PollutionCertificate: null,
    RoadTax: null, FitnessCertificate: null, Permit: null, StatePermit: null, TemporaryPermit: null,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [editSched, setEditSched] = useState<ScheduleEdit | null>(null);
  const [schedSuccess, setSchedSuccess] = useState('');
  const [schedHistoryModal, setSchedHistoryModal] = useState<ScheduleHistoryModal | null>(null);
  const [entryFormOpen, setEntryFormOpen] = useState(false);
  const [editingNumber, setEditingNumber] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Vehicle | null>(null);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === 'undefined' ? false : window.innerWidth <= 768,
  );

  useEffect(() => {
    const h = (): void => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const isEditing = editingNumber !== null;

  const computedKmPerFill = useMemo(
    () => autoKmPerFill(formData.scheduleLitres, formData.scheduleKmPerLitre),
    [formData.scheduleLitres, formData.scheduleKmPerLitre],
  );
  const computedEditKmPerFill = useMemo(
    () => (editSched ? autoKmPerFill(editSched.scheduleLitres, editSched.scheduleKmPerLitre) : ''),
    [editSched],
  );

  const set = <K extends keyof FormState>(name: K, value: FormState[K]): void => {
    setFormData((prev) => {
      const next: FormState = { ...prev, [name]: value };
      if (name === 'nationalPermit' && value === 'No') next.permitUpto = '';
      if (name === 'statePermit' && value === 'No') next.statePermitValidUpto = '';
      if (name === 'temporaryPermit' && value === 'No') next.TemporarypermitUpto = '';
      if (name === 'vehicleType' && typeof value === 'string') {
        const def = SCHEDULE_DEFAULTS[value];
        if (def) {
          if (!prev.scheduleInterval) next.scheduleInterval = def.scheduleInterval;
          if (!prev.scheduleLitres) next.scheduleLitres = def.scheduleLitres;
          if (!prev.scheduleKmPerLitre) next.scheduleKmPerLitre = def.scheduleKmPerLitre;
        }
      }
      return next;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, docType: FileKey): void => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
      toastError('Only PDF, JPG, PNG allowed.');
      return;
    }
    setDocuments((prev) => ({ ...prev, [docType]: file }));
  };

  const validateForm = (): boolean => {
    const an = /^[a-zA-Z0-9 ]+$/;
    const al = /^[a-zA-Z ]+$/;
    if (!an.test(formData.vehicleNumber)) {
      toastError('Vehicle Number: alphanumeric only.');
      return false;
    }
    if (!al.test(formData.registerName)) {
      toastError('Register Name: alphabets only.');
      return false;
    }
    if (!formData.vehicleType.trim()) {
      toastError('Vehicle Type: please select a type.');
      return false;
    }
    if (!an.test(formData.grossVehicleWeight)) {
      toastError('GVW: alphanumeric only.');
      return false;
    }
    return true;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!validateForm()) return;

    if (isEditing && editingNumber) {
      const body: Record<string, unknown> = {
        registerName: formData.registerName,
        vehicleType: formData.vehicleType,
        grossVehicleWeight: formData.grossVehicleWeight,
        nationalPermit: formData.nationalPermit,
        statePermit: formData.statePermit,
        temporaryPermit: formData.temporaryPermit,
        chassisNumber: formData.chassisNumber || undefined,
        engineNumber: formData.engineNumber || undefined,
        fuelType: formData.fuelType || undefined,
        remarks: formData.remarks || undefined,
      };
      const dateFields: Array<keyof FormState> = [
        'registrationDate', 'fitnessValidUpto', 'taxValidUpto', 'insuranceValidUpto',
        'pollutionValidUpto', 'permitUpto', 'statePermitValidUpto', 'TemporarypermitUpto',
      ];
      for (const k of dateFields) {
        const v = formData[k];
        if (typeof v === 'string' && v) body[k] = new Date(v).toISOString();
      }
      updateVehicleMutation.mutate(
        { vehicleNumber: editingNumber, body },
        {
          onSuccess: () => {
            handleClear();
            setEntryFormOpen(false);
            setEditingNumber(null);
          },
        },
      );
      return;
    }

    const fd = new FormData();
    const submitData: FormState = {
      ...formData,
      scheduleKmPerFill: formData.scheduleKmPerFill || computedKmPerFill,
    };
    Object.entries(submitData).forEach(([k, v]) => {
      if (v != null && v !== '') fd.append(k, String(v));
    });
    Object.entries(documents).forEach(([k, file]) => {
      if (file) fd.append(k, file);
    });
    create.mutate(fd, {
      onSuccess: () => {
        handleClear();
        setEntryFormOpen(false);
      },
    });
  };

  const handleClear = (): void => {
    setFormData(emptyForm);
    setDocuments({
      RegistrationCertificate: null, Insurance: null, PollutionCertificate: null,
      RoadTax: null, FitnessCertificate: null, Permit: null, StatePermit: null, TemporaryPermit: null,
    });
    setEditingNumber(null);
  };

  const downloadCSV = async (): Promise<void> => {
    try {
      const res = await vehiclesApi.exportCsv();
      saveAs(res.data, 'VehicleOnboardingData.csv');
    } catch {
      toastError('CSV download failed');
    }
  };

  const openAddVehicle = (): void => {
    handleClear();
    setEditingNumber(null);
    setEntryFormOpen(true);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openEditVehicle = (v: Vehicle): void => {
    setFormData({
      vehicleNumber: v.vehicleNumber,
      registerName: v.registerName ?? '',
      vehicleType: v.vehicleType ?? '',
      grossVehicleWeight: v.grossVehicleWeight ?? '',
      registrationDate: dateOnly(v.registrationDate),
      fitnessValidUpto: dateOnly(v.fitnessValidUpto),
      taxValidUpto: dateOnly(v.taxValidUpto),
      insuranceValidUpto: dateOnly(v.insuranceValidUpto),
      pollutionValidUpto: dateOnly(v.pollutionValidUpto),
      nationalPermit: (v.nationalPermit as 'Yes' | 'No') ?? 'No',
      permitUpto: dateOnly(v.permitUpto),
      statePermit: (v.statePermit as 'Yes' | 'No') ?? 'No',
      statePermitValidUpto: dateOnly(v.statePermitValidUpto),
      temporaryPermit: (v.temporaryPermit as 'Yes' | 'No') ?? 'No',
      TemporarypermitUpto: dateOnly(v.TemporarypermitUpto),
      chassisNumber: (v.chassisNumber as string | undefined) ?? '',
      engineNumber: (v.engineNumber as string | undefined) ?? '',
      fuelType: (v.fuelType as string | undefined) ?? '',
      scheduleDate: dateOnly(v.scheduleDate),
      scheduleInterval: v.scheduleInterval != null ? String(v.scheduleInterval) : '',
      scheduleLitres: v.scheduleLitres != null ? String(v.scheduleLitres) : '',
      scheduleKmPerLitre: v.scheduleKmPerLitre != null ? String(v.scheduleKmPerLitre) : '',
      scheduleKmPerFill: v.scheduleKmPerFill != null ? String(v.scheduleKmPerFill) : '',
      scheduleKmActual: v.scheduleKmActual != null ? String(v.scheduleKmActual) : '',
      remarks: (v.remarks as string | undefined) ?? '',
    });
    setDocuments({
      RegistrationCertificate: null, Insurance: null, PollutionCertificate: null,
      RoadTax: null, FitnessCertificate: null, Permit: null, StatePermit: null, TemporaryPermit: null,
    });
    setEditingNumber(v.vehicleNumber);
    setEntryFormOpen(true);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openEditSched = (v: Vehicle): void => {
    setEditSched({
      vehicleNumber: v.vehicleNumber,
      scheduleDate: dateOnly(v.scheduleDate),
      scheduleInterval: v.scheduleInterval != null ? String(v.scheduleInterval) : '',
      scheduleLitres: v.scheduleLitres != null ? String(v.scheduleLitres) : '',
      scheduleKmPerLitre: v.scheduleKmPerLitre != null ? String(v.scheduleKmPerLitre) : '',
      scheduleKmPerFill: v.scheduleKmPerFill != null ? String(v.scheduleKmPerFill) : '',
      scheduleKmActual: v.scheduleKmActual != null ? String(v.scheduleKmActual) : '',
    });
    setSchedSuccess('');
  };

  const saveEditSched = (): void => {
    if (!editSched) return;
    const body: Record<string, unknown> = {
      scheduleDate: editSched.scheduleDate || null,
      scheduleInterval: editSched.scheduleInterval ? Number(editSched.scheduleInterval) : null,
      scheduleLitres: editSched.scheduleLitres ? Number(editSched.scheduleLitres) : null,
      scheduleKmPerLitre: editSched.scheduleKmPerLitre ? Number(editSched.scheduleKmPerLitre) : null,
      scheduleKmPerFill: editSched.scheduleKmPerFill
        ? Number(editSched.scheduleKmPerFill)
        : computedEditKmPerFill
          ? Number(computedEditKmPerFill)
          : null,
      scheduleKmActual: editSched.scheduleKmActual ? Number(editSched.scheduleKmActual) : null,
    };
    updateSchedule.mutate(
      { vehicleNumber: editSched.vehicleNumber, body },
      {
        onSuccess: () => {
          setSchedSuccess('Schedule updated successfully!');
          window.setTimeout(() => {
            setEditSched(null);
            setSchedSuccess('');
          }, 1200);
        },
      },
    );
  };

  const openScheduleDateHistory = (v: Vehicle): void => {
    const raw = (v as Vehicle & { scheduleDateHistory?: ScheduleHistoryEntry[] }).scheduleDateHistory ?? [];
    const sorted = [...raw].sort((a, b) => {
      const ta = a.changedAt ? new Date(a.changedAt).getTime() : 0;
      const tb = b.changedAt ? new Date(b.changedAt).getTime() : 0;
      return tb - ta;
    });
    setSchedHistoryModal({
      vehicleNumber: v.vehicleNumber,
      currentScheduleDate: dateOnly(v.scheduleDate) || null,
      items: sorted,
    });
  };

  const onConfirmDelete = (): void => {
    if (!confirmDelete) return;
    deleteVehicle.mutate(confirmDelete.vehicleNumber, {
      onSuccess: () => {
        setConfirmDelete(null);
        toastSuccess('Vehicle deleted');
      },
    });
  };

  const filteredVehicles = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter((v) => {
      const hay = [
        v.vehicleNumber, v.registerName, v.vehicleType,
        v.chassisNumber, v.engineNumber, v.fuelType,
      ]
        .filter(Boolean)
        .map(String)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [vehicles, searchTerm]);

  const submitting = create.isPending || updateVehicleMutation.isPending;

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
    formWrapper: { padding: isMobile ? '14px' : '20px' },
    sectionTitle: {
      fontWeight: 'bold',
      fontSize: C.fontSizeSm,
      color: C.black,
      borderBottom: C.borderYellow,
      paddingBottom: '6px',
      marginBottom: '16px',
      marginTop: '20px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    formGrid: {
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
      color: C.black,
      backgroundColor: C.white,
      outline: 'none',
      fontFamily: C.fontFamily,
    },
    buttonRow: {
      display: 'flex',
      gap: '12px',
      justifyContent: 'flex-end',
      marginTop: '10px',
      paddingBottom: '10px',
      flexWrap: 'wrap',
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
    searchContainer: {
      padding: '14px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      flexWrap: 'wrap',
    },
    searchInput: {
      width: '320px',
      maxWidth: '100%',
      padding: '9px 12px',
      border: C.border,
      borderRadius: C.radius,
      fontSize: C.fontSize,
      color: C.black,
      fontFamily: C.fontFamily,
    },
    table: getVmRecordTableStyle(isMobile, VEHICLE_ONBOARDING_RECORD_HEADERS.length),
    th: getVmRecordThStyle(isMobile),
    td: { ...getVmRecordTdStyle(isMobile), color: C.black },
    downloadBtn: {
      padding: '9px 22px',
      backgroundColor: C.yellow,
      color: C.black,
      border: 'none',
      borderRadius: C.radius,
      cursor: 'pointer',
      fontWeight: 'bold',
      fontSize: C.fontSize,
      margin: '14px 20px',
      fontFamily: C.fontFamily,
    },
    fileLabel: {
      fontWeight: 'bold',
      fontSize: C.fontSizeSm,
      marginBottom: '5px',
      display: 'block',
      color: C.black,
    },
    fileSuccess: { fontSize: '12px', color: 'green', marginTop: '4px' },
    autoTag: {
      fontSize: '11px',
      backgroundColor: '#f5f5f5',
      color: C.black,
      border: '1px solid #ccc',
      borderRadius: '3px',
      padding: '1px 6px',
      marginLeft: '6px',
      fontWeight: 'bold',
    },
    overlay: {
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.45)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    },
    modal: {
      background: C.white,
      borderRadius: '6px',
      width: '100%',
      maxWidth: isMobile ? '98vw' : '540px',
      maxHeight: '90vh',
      overflowY: 'auto',
      boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
    },
    modalHeader: {
      backgroundColor: C.yellow,
      color: C.black,
      padding: '14px 20px',
      fontWeight: 'bold',
      fontSize: C.fontSize,
      borderRadius: '6px 6px 0 0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    modalBody: { padding: isMobile ? '14px' : '20px' },
    modalGrid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
      gap: '14px',
      marginBottom: '14px',
    },
    modalGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
    successMsg: {
      backgroundColor: '#f5f5f5',
      color: C.black,
      padding: '10px 14px',
      borderRadius: C.radius,
      fontSize: C.fontSizeSm,
      marginBottom: '12px',
      border: '1px solid #ccc',
      fontWeight: 'bold',
    },
  };

  return (
    <div style={S.container}>
      <div style={S.pageHeader}>VEHICLE ONBOARDING</div>

      <div style={S.formWrapper}>
        <div style={S.sectionTitle}>{isEditing ? `Edit ${editingNumber}` : 'Add vehicle'}</div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: entryFormOpen ? '14px' : '20px',
            flexWrap: 'wrap',
            width: '100%',
          }}
        >
          <button
            type="button"
            style={{ ...S.btnYellow, ...(entryFormOpen ? { opacity: 0.85 } : {}) }}
            onClick={openAddVehicle}
            disabled={entryFormOpen}
          >
            Add Vehicle
          </button>
          {entryFormOpen ? (
            <button
              type="button"
              aria-label="Close form"
              title="Close form"
              disabled={submitting}
              onClick={() => {
                setEntryFormOpen(false);
                handleClear();
              }}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                fontSize: '18px',
                lineHeight: 1,
                color: C.black,
                fontFamily: C.fontFamily,
                fontWeight: 'bold',
                padding: '4px 8px',
                minHeight: 44,
                minWidth: 44,
                cursor: submitting ? 'not-allowed' : 'pointer',
                touchAction: 'manipulation',
                opacity: submitting ? 0.5 : 1,
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          ) : null}
        </div>

        {entryFormOpen ? (
          <form onSubmit={handleSubmit}>
            <div style={S.sectionTitle}>Vehicle Information</div>
            <div style={S.formGrid}>
              <div>
                <label style={S.label}>Vehicle Number:</label>
                <input
                  type="text"
                  style={S.input}
                  value={formData.vehicleNumber}
                  onChange={(e) => set('vehicleNumber', e.target.value)}
                  disabled={isEditing}
                  required
                />
              </div>
              <div>
                <label style={S.label}>Register Owner Name:</label>
                <input
                  type="text"
                  style={S.input}
                  value={formData.registerName}
                  onChange={(e) => set('registerName', e.target.value)}
                  required
                />
              </div>
              <div>
                <label style={S.label}>Vehicle Type:</label>
                <select
                  style={S.input}
                  value={formData.vehicleType}
                  onChange={(e) => set('vehicleType', e.target.value)}
                  required
                >
                  <option value="">Select Type</option>
                  <optgroup label="Fleet Trucks">
                    <option value="Pickup Truck">Pickup Truck</option>
                    <option value="407 Truck">407 Truck</option>
                    <option value="17FT">17FT</option>
                    <option value="20FT">20FT</option>
                    <option value="Truck">Truck (Other)</option>
                  </optgroup>
                  <optgroup label="Other Vehicles">
                    <option value="Bus">Bus</option>
                    <option value="Car">Car</option>
                    <option value="Bike">Bike</option>
                  </optgroup>
                </select>
              </div>
              <div>
                <label style={S.label}>Gross Vehicle Weight:</label>
                <input
                  type="text"
                  style={S.input}
                  value={formData.grossVehicleWeight}
                  onChange={(e) => set('grossVehicleWeight', e.target.value)}
                  required
                />
              </div>
              <div>
                <label style={S.label}>Registration Date:</label>
                <DatePicker
                  value={formData.registrationDate}
                  onChange={(v) => set('registrationDate', v)}
                />
              </div>
            </div>

            <div style={S.sectionTitle}>Identification</div>
            <div style={S.formGrid}>
              <div>
                <label style={S.label}>Chassis Number:</label>
                <input
                  type="text"
                  style={S.input}
                  value={formData.chassisNumber}
                  onChange={(e) => set('chassisNumber', e.target.value)}
                />
              </div>
              <div>
                <label style={S.label}>Engine Number:</label>
                <input
                  type="text"
                  style={S.input}
                  value={formData.engineNumber}
                  onChange={(e) => set('engineNumber', e.target.value)}
                />
              </div>
              <div>
                <label style={S.label}>Fuel Type:</label>
                <select
                  style={S.input}
                  value={formData.fuelType}
                  onChange={(e) => set('fuelType', e.target.value)}
                >
                  <option value="">—</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Petrol">Petrol</option>
                  <option value="CNG">CNG</option>
                  <option value="Electric">Electric</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div style={S.sectionTitle}>Document Validity Dates</div>
            <div style={S.formGrid}>
              <div>
                <label style={S.label}>Fitness Valid Upto:</label>
                <DatePicker
                  value={formData.fitnessValidUpto}
                  onChange={(v) => set('fitnessValidUpto', v)}
                />
              </div>
              <div>
                <label style={S.label}>Tax Valid Upto:</label>
                <DatePicker value={formData.taxValidUpto} onChange={(v) => set('taxValidUpto', v)} />
              </div>
              <div>
                <label style={S.label}>Insurance Valid Upto:</label>
                <DatePicker
                  value={formData.insuranceValidUpto}
                  onChange={(v) => set('insuranceValidUpto', v)}
                />
              </div>
              <div>
                <label style={S.label}>Pollution Valid Upto:</label>
                <DatePicker
                  value={formData.pollutionValidUpto}
                  onChange={(v) => set('pollutionValidUpto', v)}
                />
              </div>

              <div>
                <label style={S.label}>State Permit:</label>
                <select
                  style={S.input}
                  value={formData.statePermit}
                  onChange={(e) => set('statePermit', e.target.value as 'Yes' | 'No')}
                  required
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
              {formData.statePermit === 'Yes' && (
                <div>
                  <label style={S.label}>State Permit Valid Upto:</label>
                  <DatePicker
                    value={formData.statePermitValidUpto}
                    onChange={(v) => set('statePermitValidUpto', v)}
                  />
                </div>
              )}

              <div>
                <label style={S.label}>National Permit:</label>
                <select
                  style={S.input}
                  value={formData.nationalPermit}
                  onChange={(e) => set('nationalPermit', e.target.value as 'Yes' | 'No')}
                  required
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
              {formData.nationalPermit === 'Yes' && (
                <div>
                  <label style={S.label}>National Permit Upto:</label>
                  <DatePicker value={formData.permitUpto} onChange={(v) => set('permitUpto', v)} />
                </div>
              )}

              <div>
                <label style={S.label}>Temporary Permit:</label>
                <select
                  style={S.input}
                  value={formData.temporaryPermit}
                  onChange={(e) => set('temporaryPermit', e.target.value as 'Yes' | 'No')}
                  required
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
              {formData.temporaryPermit === 'Yes' && (
                <div>
                  <label style={S.label}>Temporary Permit Upto:</label>
                  <DatePicker
                    value={formData.TemporarypermitUpto}
                    onChange={(v) => set('TemporarypermitUpto', v)}
                  />
                </div>
              )}
            </div>

            <div style={S.sectionTitle}>Schedule Configuration</div>
            <div style={S.formGrid}>
              <div>
                <label style={S.label}>Schedule Date:</label>
                <DatePicker
                  value={formData.scheduleDate}
                  onChange={(v) => set('scheduleDate', v)}
                />
              </div>
              <div>
                <label style={S.label}>Refill interval (days):</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  style={S.input}
                  value={formData.scheduleInterval}
                  onChange={(e) => set('scheduleInterval', e.target.value)}
                />
              </div>
              <div>
                <label style={S.label}>Litres per Fill:</label>
                <input
                  type="number"
                  min={1}
                  step="0.1"
                  style={S.input}
                  value={formData.scheduleLitres}
                  onChange={(e) => set('scheduleLitres', e.target.value)}
                />
              </div>
              <div>
                <label style={S.label}>KM per Litre (Mileage):</label>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  style={S.input}
                  value={formData.scheduleKmPerLitre}
                  onChange={(e) => set('scheduleKmPerLitre', e.target.value)}
                />
              </div>
              <div>
                <label style={S.label}>
                  Expected KM per Fill:
                  {computedKmPerFill && !formData.scheduleKmPerFill && (
                    <span style={S.autoTag}>AUTO</span>
                  )}
                </label>
                <input
                  type="number"
                  style={S.input}
                  placeholder={computedKmPerFill ? computedKmPerFill : ''}
                  value={formData.scheduleKmPerFill || computedKmPerFill}
                  onChange={(e) => set('scheduleKmPerFill', e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginTop: '16px', marginBottom: '16px' }}>
              <label style={S.label}>Remarks:</label>
              <textarea
                style={{ ...S.input, minHeight: '70px', resize: 'vertical' }}
                value={formData.remarks}
                onChange={(e) => set('remarks', e.target.value)}
              />
            </div>

            {!isEditing && (
              <>
                <div style={S.sectionTitle}>Document Uploads</div>
                <div style={S.formGrid}>
                  {(['RegistrationCertificate', 'Insurance', 'PollutionCertificate', 'RoadTax', 'FitnessCertificate'] as const).map((docType) => (
                    <div key={docType}>
                      <label style={S.fileLabel}>
                        {docType.replace(/([A-Z])/g, ' $1').trim()}:
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload(e, docType)}
                        style={{ fontSize: '13px' }}
                      />
                      {documents[docType] && (
                        <p style={S.fileSuccess}>Uploaded: {documents[docType]?.name}</p>
                      )}
                    </div>
                  ))}
                  {formData.statePermit === 'Yes' && (
                    <div>
                      <label style={S.fileLabel}>State Permit Document:</label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload(e, 'StatePermit')}
                        style={{ fontSize: '13px' }}
                      />
                      {documents.StatePermit && (
                        <p style={S.fileSuccess}>Uploaded: {documents.StatePermit?.name}</p>
                      )}
                    </div>
                  )}
                  {formData.nationalPermit === 'Yes' && (
                    <div>
                      <label style={S.fileLabel}>National Permit Document:</label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload(e, 'Permit')}
                        style={{ fontSize: '13px' }}
                      />
                      {documents.Permit && (
                        <p style={S.fileSuccess}>Uploaded: {documents.Permit?.name}</p>
                      )}
                    </div>
                  )}
                  {formData.temporaryPermit === 'Yes' && (
                    <div>
                      <label style={S.fileLabel}>Temporary Permit Document:</label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload(e, 'TemporaryPermit')}
                        style={{ fontSize: '13px' }}
                      />
                      {documents.TemporaryPermit && (
                        <p style={S.fileSuccess}>Uploaded: {documents.TemporaryPermit?.name}</p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            <div style={S.buttonRow}>
              <button
                type="button"
                style={S.btnBlack}
                onClick={() => {
                  setEntryFormOpen(false);
                  handleClear();
                }}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                style={S.btnBlack}
                onClick={handleClear}
                disabled={submitting}
              >
                Clear
              </button>
              <button
                type="submit"
                style={{ ...S.btnYellow, opacity: submitting ? 0.7 : 1 }}
                disabled={submitting}
              >
                {submitting
                  ? isEditing
                    ? 'Updating...'
                    : 'Submitting...'
                  : isEditing
                    ? 'Update'
                    : 'Submit'}
              </button>
            </div>
          </form>
        ) : null}
      </div>

      <div style={S.searchContainer}>
        <input
          type="text"
          placeholder="Search…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={S.searchInput}
        />
        <span style={{ fontSize: '12px', color: '#666' }}>
          {filteredVehicles.length} of {vehicles.length} vehicle{vehicles.length === 1 ? '' : 's'}
        </span>
      </div>

      <div style={vmTableScrollWrap}>
        <table style={S.table}>
          {isMobile ? <VmColGroup columnCount={VEHICLE_ONBOARDING_RECORD_HEADERS.length} /> : null}
          <thead>
            <tr>
              {VEHICLE_ONBOARDING_RECORD_HEADERS.map((h) => (
                <th key={h} style={S.th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={VEHICLE_ONBOARDING_RECORD_HEADERS.length}
                  style={{ ...S.td, textAlign: 'center', padding: '24px', color: '#888' }}
                >
                  Loading…
                </td>
              </tr>
            ) : filteredVehicles.length > 0 ? (
              filteredVehicles.map((v, i) => (
                <tr key={v.id ?? v.vehicleNumber} style={{ backgroundColor: vmRecordRowBg(i) }}>
                  <td style={S.td}>{v.vehicleNumber}</td>
                  <td style={S.td}>{v.registerName}</td>
                  <td style={S.td}>{v.vehicleType}</td>
                  <td style={S.td}>{(v.chassisNumber as string | undefined) || '—'}</td>
                  <td style={S.td}>{(v.engineNumber as string | undefined) || '—'}</td>
                  <td style={S.td}>{(v.fuelType as string | undefined) || '—'}</td>
                  <td style={S.td}>{v.grossVehicleWeight}</td>
                  <td style={S.td}>{fmtDate(v.registrationDate)}</td>
                  <td style={S.td}>{fmtDate(v.fitnessValidUpto)}</td>
                  <td style={S.td}>{fmtDate(v.taxValidUpto)}</td>
                  <td style={S.td}>{fmtDate(v.insuranceValidUpto)}</td>
                  <td style={S.td}>{fmtDate(v.pollutionValidUpto)}</td>
                  <td style={S.td}>{fmtDate(v.statePermitValidUpto)}</td>
                  <td style={S.td}>{v.nationalPermit}</td>
                  <td style={S.td}>{fmtDate(v.permitUpto)}</td>
                  <td style={S.td}>{fmtDate(v.scheduleDate)}</td>
                  <td style={S.td}>
                    {v.scheduleInterval != null ? `${v.scheduleInterval} days` : ''}
                  </td>
                  <td style={S.td}>
                    {v.scheduleLitres != null ? `${v.scheduleLitres} L` : ''}
                  </td>
                  <td style={S.td}>
                    {v.scheduleKmPerLitre != null ? `${v.scheduleKmPerLitre} km/L` : ''}
                  </td>
                  <td style={S.td}>
                    {v.scheduleKmPerFill != null ? `${v.scheduleKmPerFill} km` : ''}
                  </td>
                  <td style={S.td}>
                    {v.scheduleKmActual != null ? `${v.scheduleKmActual} km` : ''}
                  </td>
                  <td style={S.td}>{(v.remarks as string | undefined) ?? ''}</td>
                  {(['RegistrationCertificate', 'Insurance', 'PollutionCertificate', 'RoadTax', 'FitnessCertificate', 'Permit'] as const).map((fk) => {
                    const filePath = (v as Record<string, unknown>)[fk] as string | null | undefined;
                    return (
                      <td key={fk} style={S.td}>
                        {filePath ? (
                          <button
                            type="button"
                            onClick={() => window.open(`${config.apiBase}/${filePath}`, '_blank')}
                            style={{
                              cursor: 'pointer',
                              color: '#0000ee',
                              border: 'none',
                              background: 'none',
                              fontSize: '13px',
                              fontFamily: C.fontFamily,
                            }}
                          >
                            View
                          </button>
                        ) : (
                          'N/A'
                        )}
                      </td>
                    );
                  })}
                  <td style={S.td}>
                    <button
                      type="button"
                      onClick={() => openScheduleDateHistory(v)}
                      style={{
                        padding: '5px 12px',
                        backgroundColor: C.white,
                        color: C.black,
                        border: C.border,
                        borderRadius: C.radius,
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        fontFamily: C.fontFamily,
                      }}
                    >
                      History
                    </button>
                  </td>
                  <td style={S.td}>
                    <button
                      type="button"
                      onClick={() => openEditSched(v)}
                      style={{
                        padding: '5px 12px',
                        backgroundColor: C.yellow,
                        color: C.black,
                        border: 'none',
                        borderRadius: C.radius,
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        fontFamily: C.fontFamily,
                      }}
                    >
                      Edit Schedule
                    </button>
                  </td>
                  <td style={S.td}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => openEditVehicle(v)}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: C.white,
                          color: C.black,
                          border: C.border,
                          borderRadius: C.radius,
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          fontFamily: C.fontFamily,
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(v)}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#dc2626',
                          color: C.white,
                          border: 'none',
                          borderRadius: C.radius,
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          fontFamily: C.fontFamily,
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={VEHICLE_ONBOARDING_RECORD_HEADERS.length}
                  style={{ ...S.td, textAlign: 'center', padding: '24px', color: '#888' }}
                >
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <button type="button" style={S.downloadBtn} onClick={() => void downloadCSV()}>
        Download CSV
      </button>

      {editSched && (
        <div
          style={S.overlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditSched(null);
          }}
        >
          <div style={S.modal}>
            <div style={S.modalHeader}>
              <span>Edit Schedule — {editSched.vehicleNumber}</span>
              <button
                type="button"
                onClick={() => setEditSched(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: C.black,
                }}
              >
                x
              </button>
            </div>
            <div style={S.modalBody}>
              {schedSuccess && <div style={S.successMsg}>{schedSuccess}</div>}

              <div style={S.modalGrid}>
                <div style={S.modalGroup}>
                  <label style={S.label}>Fill Interval (Days):</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    style={S.input}
                    value={editSched.scheduleInterval}
                    onChange={(e) =>
                      setEditSched({ ...editSched, scheduleInterval: e.target.value })
                    }
                  />
                </div>
                <div style={S.modalGroup}>
                  <label style={S.label}>Next Schedule Date:</label>
                  <DatePicker
                    value={editSched.scheduleDate}
                    onChange={(v) => setEditSched({ ...editSched, scheduleDate: v })}
                  />
                </div>
                <div style={S.modalGroup}>
                  <label style={S.label}>Litres per Fill:</label>
                  <input
                    type="number"
                    min={1}
                    step="0.1"
                    style={S.input}
                    value={editSched.scheduleLitres}
                    onChange={(e) =>
                      setEditSched({ ...editSched, scheduleLitres: e.target.value })
                    }
                  />
                </div>
                <div style={S.modalGroup}>
                  <label style={S.label}>KM per Litre:</label>
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    style={S.input}
                    value={editSched.scheduleKmPerLitre}
                    onChange={(e) =>
                      setEditSched({ ...editSched, scheduleKmPerLitre: e.target.value })
                    }
                  />
                </div>
                <div style={S.modalGroup}>
                  <label style={S.label}>
                    Expected KM per Fill:
                    {computedEditKmPerFill && !editSched.scheduleKmPerFill && (
                      <span style={S.autoTag}>AUTO</span>
                    )}
                  </label>
                  <input
                    type="number"
                    style={S.input}
                    placeholder={computedEditKmPerFill ? computedEditKmPerFill : ''}
                    value={editSched.scheduleKmPerFill || computedEditKmPerFill}
                    onChange={(e) =>
                      setEditSched({ ...editSched, scheduleKmPerFill: e.target.value })
                    }
                  />
                </div>
                <div style={S.modalGroup}>
                  <label style={S.label}>Odometer KM:</label>
                  <input
                    type="number"
                    style={S.input}
                    value={editSched.scheduleKmActual}
                    onChange={(e) =>
                      setEditSched({ ...editSched, scheduleKmActual: e.target.value })
                    }
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
                <button type="button" style={S.btnBlack} onClick={() => setEditSched(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  style={S.btnYellow}
                  onClick={saveEditSched}
                  disabled={updateSchedule.isPending}
                >
                  {updateSchedule.isPending ? 'Saving...' : 'Save Schedule'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {schedHistoryModal && (
        <div
          style={S.overlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSchedHistoryModal(null);
          }}
        >
          <div style={{ ...S.modal, maxWidth: isMobile ? '98vw' : '720px' }}>
            <div style={S.modalHeader}>
              <span>Schedule history · {schedHistoryModal.vehicleNumber}</span>
              <button
                type="button"
                onClick={() => setSchedHistoryModal(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: C.black,
                }}
              >
                x
              </button>
            </div>
            <div style={S.modalBody}>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  marginBottom: '12px',
                  color: C.black,
                }}
              >
                Current schedule date: {fmtDate(schedHistoryModal.currentScheduleDate) || '—'}
              </div>
              {schedHistoryModal.items.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
                  No history yet.
                </p>
              ) : (
                <div style={vmTableScrollWrap}>
                  <table style={{ ...getVmRecordTableStyle(isMobile, 4), marginTop: 0 }}>
                    {isMobile ? <VmColGroup columnCount={4} /> : null}
                    <thead>
                      <tr>
                        <th style={S.th}>#</th>
                        <th style={S.th}>Schedule date saved</th>
                        <th style={S.th}>Saved at</th>
                        <th style={S.th}>Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedHistoryModal.items.map((h, idx) => {
                        const matchesCurrent =
                          idx === 0 &&
                          sameCalendarDay(h.scheduleDate, schedHistoryModal.currentScheduleDate);
                        return (
                          <tr key={h._id ?? idx} style={{ backgroundColor: vmRecordRowBg(idx) }}>
                            <td style={S.td}>{idx + 1}</td>
                            <td style={S.td}>
                              {fmtDate(h.scheduleDate) || '—'}
                              {matchesCurrent ? (
                                <span style={{ ...S.autoTag, marginLeft: '8px' }}>current</span>
                              ) : null}
                            </td>
                            <td style={S.td}>{fmtDateTime(h.changedAt)}</td>
                            <td style={S.td}>
                              {h.source === 'onboarding'
                                ? 'Onboarding'
                                : h.source === 'edit'
                                  ? 'Edit'
                                  : h.source ?? '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div
          style={S.overlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmDelete(null);
          }}
        >
          <div style={{ ...S.modal, maxWidth: isMobile ? '98vw' : '460px' }}>
            <div style={S.modalHeader}>
              <span>Delete vehicle?</span>
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: C.black,
                }}
              >
                x
              </button>
            </div>
            <div style={S.modalBody}>
              <p style={{ marginTop: 0 }}>
                This will delete{' '}
                <strong style={{ fontFamily: 'monospace' }}>{confirmDelete.vehicleNumber}</strong>{' '}
                ({confirmDelete.registerName}). This is a soft delete — the record can be restored from the database if needed.
              </p>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  flexWrap: 'wrap',
                  marginTop: '20px',
                }}
              >
                <button type="button" style={S.btnBlack} onClick={() => setConfirmDelete(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  style={{ ...S.btnYellow, backgroundColor: '#dc2626', color: C.white }}
                  onClick={onConfirmDelete}
                  disabled={deleteVehicle.isPending}
                >
                  {deleteVehicle.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
