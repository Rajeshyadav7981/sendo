import { useQueryClient } from '@tanstack/react-query';
import { useRealtime } from '@shared/hooks/useRealtime';
import { trackerKeys } from './tracker.hooks';

export function useTrackerRealtime(): void {
  const qc = useQueryClient();

  useRealtime<{ vehicle?: string }>(
    'tracker:fill',
    () => {
      qc.invalidateQueries({ queryKey: ['tracker', 'fills'] });
      qc.invalidateQueries({ queryKey: trackerKeys.fillMonths });
    },
    [qc],
  );

  useRealtime<{ vehicle?: string }>(
    'tracker:odometer',
    (p) => {
      if (p?.vehicle) {
        qc.invalidateQueries({ queryKey: ['tracker', 'odometer', p.vehicle] });
      } else {
        qc.invalidateQueries({ queryKey: ['tracker', 'odometer'] });
      }
    },
    [qc],
  );

  useRealtime(
    'tracker:escalation',
    () => qc.invalidateQueries({ queryKey: ['tracker', 'escalations'] }),
    [qc],
  );

  useRealtime(
    'tracker:schedule',
    () => qc.invalidateQueries({ queryKey: ['tracker', 'schedule'] }),
    [qc],
  );

  useRealtime(
    'tracker:employee',
    () => qc.invalidateQueries({ queryKey: ['tracker', 'employees'] }),
    [qc],
  );
}
