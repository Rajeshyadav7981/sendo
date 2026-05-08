import { useLocation, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { VmConfirmationShell } from '../lib/VmConfirmationShell';
import { useCreateTyre } from '../vehicles.hooks';

interface State {
  formData?: Record<string, unknown>;
}

export default function VehicleTyreConfirmationPage(): JSX.Element {
  const nav = useNavigate();
  const { state } = useLocation() as { state: State | null };
  const create = useCreateTyre();
  const formData = state?.formData ?? {};

  const onSubmit = (): void => {
    create.mutate(formData, {
      onSuccess: () => {
        void message.success('Tyre replacement submitted');
        nav('/truck-maintenance');
      },
    });
  };

  return (
    <VmConfirmationShell
      title="Tyre Replacement Confirmation"
      formData={formData}
      onBack={() => nav(-1)}
      onSubmit={onSubmit}
      isPending={create.isPending}
    />
  );
}
