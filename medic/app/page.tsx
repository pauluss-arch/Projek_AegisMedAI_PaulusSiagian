import { redirect } from 'next/navigation';
import { getPatients } from './actions/patientActions';
import { getDiseaseCatalog } from '../lib/disease-catalog';
import { bacaSesi } from '../lib/sesi';
import App from '../src/App';

export default async function HomePage() {
  if (!(await bacaSesi())) redirect('/masuk');
  const [patients, diseases] = await Promise.all([getPatients(), getDiseaseCatalog()]);
  return <App initialPatients={patients} diseases={diseases} />;
}
