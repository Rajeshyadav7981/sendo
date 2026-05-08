import { useLocation, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { VmConfirmationShell } from '../lib/VmConfirmationShell';
import { useCreateSparePart } from '../vehicles.hooks';

interface State {
  formData?: Record<string, unknown>;
}

export default function SparePartsConfirmationPage(): JSX.Element {
  const nav = useNavigate();
  const { state } = useLocation() as { state: State | null };
  const create = useCreateSparePart();
  const formData = state?.formData ?? {};

  const onSubmit = (): void => {
    create.mutate(formData, {
      onSuccess: () => {
        void message.success('Spare parts submitted');
        nav('/truck-maintenance');
      },
    });
  };

  return (
    <VmConfirmationShell
      title="Spare Parts Confirmation"
      formData={formData}
      onBack={() => nav(-1)}
      onSubmit={onSubmit}
      isPending={create.isPending}
    />
  );
}
