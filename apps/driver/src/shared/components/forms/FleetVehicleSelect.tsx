import { useFleetVehicles } from '@shared/hooks/useFleetVehicles';
import { AssignedVehicleSelect } from './AssignedVehicleSelect';

interface Props {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  id?: string;
}

export function FleetVehicleSelect({
  value,
  onChange,
  placeholder = 'Select vehicle…',
  id,
}: Props): JSX.Element {
  const { vehicles, isLoading } = useFleetVehicles();
  return (
    <AssignedVehicleSelect
      vehicles={vehicles}
      value={value}
      onChange={onChange}
      isLoading={isLoading}
      placeholder={placeholder}
      id={id}
    />
  );
}
