import { useLocation, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { VmConfirmationShell } from '../lib/VmConfirmationShell';
import { useCreateOilService } from '../vehicles.hooks';

interface State {
  formData?: Record<string, unknown>;
}

export default function OilServiceConfirmationPage(): JSX.Element {
  const nav = useNavigate();
  const { state } = useLocation() as { state: State | null };
  const create = useCreateOilService();
  const formData = state?.formData ?? {};

  const onSubmit = (): void => {
    create.mutate(formData, {
      onSuccess: () => {
        void message.success('Oil service submitted');
        nav('/truck-maintenance');
      },
    });
  };

  return (
    <VmConfirmationShell
      title="Oil Service Confirmation"
      formData={formData}
      onBack={() => nav(-1)}
      onSubmit={onSubmit}
      isPending={create.isPending}
    />
  );
}
