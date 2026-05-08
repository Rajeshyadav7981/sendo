import { useLocation, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { VmConfirmationShell } from '../lib/VmConfirmationShell';
import { useCreateExpense } from '../vehicles.hooks';

interface State {
  formData?: Record<string, unknown>;
}

export default function ExpenseConfirmationPage(): JSX.Element {
  const nav = useNavigate();
  const { state } = useLocation() as { state: State | null };
  const create = useCreateExpense();
  const formData = state?.formData ?? {};

  const onSubmit = (): void => {
    create.mutate(formData, {
      onSuccess: () => {
        void message.success('Expense submitted');
        nav('/expenses');
      },
    });
  };

  return (
    <VmConfirmationShell
      title="Expense Confirmation"
      formData={formData}
      onBack={() => nav(-1)}
      onSubmit={onSubmit}
      isPending={create.isPending}
    />
  );
}
