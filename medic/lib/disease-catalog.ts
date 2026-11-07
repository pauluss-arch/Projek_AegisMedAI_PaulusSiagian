import 'server-only';
import db from './db';
import { bacaSesi } from './sesi';
import { diseaseSchema } from '../src/lib/validations/disease';

export async function getDiseaseCatalog() {
  if (!(await bacaSesi())) {
    throw new Error('A valid session is required to read the disease catalog.');
  }

  const entries = await db.diseaseCatalogItem.findMany({
    orderBy: { name: 'asc' },
    select: { data: true },
  });
  return entries.map(({ data }) => diseaseSchema.parse(data));
}
