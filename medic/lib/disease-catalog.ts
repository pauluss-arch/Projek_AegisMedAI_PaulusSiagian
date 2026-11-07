import 'server-only';
import type { Disease } from '../src/types';
import { diseaseRecordSchema } from '../src/lib/validations/disease';
import { diseases } from '../src/mock/diseasesData';
import { prisma } from './prisma';

export async function getDiseaseCatalog(): Promise<Disease[]> {
  try {
    if (prisma?.diseaseCatalogItem?.findMany) {
      const entries = await prisma.diseaseCatalogItem.findMany({
        orderBy: { name: 'asc' },
      });

      if (entries.length > 0) {
        return entries.map((entry) => diseaseRecordSchema.parse(entry.data));
      }
    }
  } catch (error) {
    console.error('Failed to load disease catalog from database, falling back to static dataset:', error);
  }

  return diseases;
}
