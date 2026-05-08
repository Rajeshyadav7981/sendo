import { config } from '@config/env';
import type { VehicleOnboardingData } from '@features/onboarding/onboarding.api';

export const DOC_LABELS: Record<string, string> = {
  RegistrationCertificate: 'Registration Certificate (RC)',
  Insurance: 'Insurance',
  FitnessCertificate: 'Fitness Certificate',
  PollutionCertificate: 'Pollution Certificate (PUC)',
  RoadTax: 'Road Tax',
  Permit: 'Permit',
  StatePermit: 'State Permit',
  TemporaryPermit: 'Temporary Permit',
};

export type DocumentKey = keyof typeof DOC_LABELS;

export function buildDocumentUrl(filePath: string): string {
  return `${config.apiBase}/${String(filePath).replace(/\\/g, '/')}`;
}

export function listAvailableDocuments(
  vehicle: VehicleOnboardingData,
): Array<{ key: DocumentKey; label: string; path: string }> {
  return (Object.keys(DOC_LABELS) as DocumentKey[])
    .filter((k) => Boolean((vehicle as Record<string, unknown>)[k]))
    .map((k) => ({
      key: k,
      label: DOC_LABELS[k],
      path: String((vehicle as Record<string, unknown>)[k]),
    }));
}
