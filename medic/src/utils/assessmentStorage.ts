import type { AssessmentHistoryEntry } from '../types';

export const STORAGE_KEY = 'aegismed.preferences.v2';
export const HISTORY_LIMIT = 25;

export function isStoredHistory(value: unknown): value is AssessmentHistoryEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<AssessmentHistoryEntry>;
  return typeof entry.id === 'string' && typeof entry.timestamp === 'string' &&
    Number.isFinite(Date.parse(entry.timestamp)) && typeof entry.patientHashId === 'string' &&
    Array.isArray(entry.diagnoses) && entry.diagnoses.every((item) =>
      typeof item?.name === 'string' && Number.isFinite(item.probability) && typeof item.icd11 === 'string') &&
    (entry.signatureStatus === 'Not signed' || entry.signatureStatus === 'Demo signature confirmed') &&
    (entry.prescribedAntibiotic === null || typeof entry.prescribedAntibiotic === 'string');
}

export function migrateHistory(value: unknown): AssessmentHistoryEntry[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item: unknown) => {
    if (isStoredHistory(item)) return [item];
    if (!item || typeof item !== 'object') return [];
    const legacy = item as { id?: unknown; timestamp?: unknown; patientId?: unknown; diagnoses?: unknown; prescriptionStatus?: unknown };
    const migrated: AssessmentHistoryEntry = {
      id: typeof legacy.id === 'string' ? legacy.id : crypto.randomUUID(),
      timestamp: typeof legacy.timestamp === 'string' ? legacy.timestamp : new Date().toISOString(),
      patientHashId: typeof legacy.patientId === 'string' ? legacy.patientId : '',
      diagnoses: Array.isArray(legacy.diagnoses) ? legacy.diagnoses as AssessmentHistoryEntry['diagnoses'] : [],
      prescribedAntibiotic: null,
      signatureStatus: legacy.prescriptionStatus === 'Demo signature confirmed' ? 'Demo signature confirmed' : 'Not signed',
    };
    return isStoredHistory(migrated) ? [migrated] : [];
  }).slice(0, HISTORY_LIMIT);
}
