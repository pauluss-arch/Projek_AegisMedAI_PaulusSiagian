import { redirect } from 'next/navigation';
import { getPatients } from '../actions/patientActions';
import { bacaSesi } from '../../lib/sesi';
import { getDiseaseCatalog } from '../../lib/disease-catalog';
import App from '../../src/App';

export const dynamic = 'force-dynamic';

export default async function ClinicalToolsPage() {
  if (!(await bacaSesi())) redirect('/masuk');
  const [patients, diseases] = await Promise.all([getPatients(), getDiseaseCatalog()]);
  return <App initialPatients={patients} initialDiseases={diseases} />;
}
