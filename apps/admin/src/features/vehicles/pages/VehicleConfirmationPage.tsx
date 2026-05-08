import { useNavigate, useLocation } from 'react-router-dom';
import { message } from 'antd';
import { VmConfirmationShell } from '../lib/VmConfirmationShell';
import { useCreateVehicle } from '../vehicles.hooks';

interface State {
  formData?: Record<string, unknown>;
  files?: Record<string, File>;
}

export default function VehicleConfirmationPage(): JSX.Element {
  const nav = useNavigate();
  const { state } = useLocation() as { state: State | null };
  const create = useCreateVehicle();

  const formData = state?.formData ?? {};
  const files = state?.files ?? {};

  const onSubmit = (): void => {
    const fd = new FormData();
    Object.entries(formData).forEach(([k, v]) => {
      if (v != null && v !== '') fd.append(k, String(v));
    });
    Object.entries(files).forEach(([k, file]) => {
      if (file instanceof File) fd.append(k, file);
    });
    create.mutate(fd, {
      onSuccess: () => {
        void message.success('Vehicle details submitted');
        nav('/vehicle-onboarding');
      },
    });
  };

  return (
    <VmConfirmationShell
      title="Vehicle Confirmation"
      formData={formData}
      onBack={() => nav(-1)}
      onSubmit={onSubmit}
      isPending={create.isPending}
    />
  );
}
