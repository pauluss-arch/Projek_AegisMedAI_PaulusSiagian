import { decryptMedicalRecord, encryptMedicalRecord, hashPatientIdentity } from './patientCrypto';

(async () => {
  // Skenario Uji Otomatis (Unit Testing)
  const testKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  // Uji 1 (Positif): Hashing nama pasien konsisten dan normalisasi input
  const hashA = await hashPatientIdentity('Siti Rahma');
  const hashB = await hashPatientIdentity(' siti   rahma ');
  console.assert(hashA === hashB, 'Test 1 Failed: Hash output mismatched after normalization');

  // Uji 2 (Positif): Enkripsi dan Dekripsi Rekam Medis Berhasil
  const originalText = 'Diagnosa: Community-Acquired Pneumonia';
  const encrypted = await encryptMedicalRecord(originalText, testKey);
  const decrypted = await decryptMedicalRecord(encrypted, testKey);
  console.assert(decrypted === originalText, 'Test 2 Failed: Decryption result mismatched');

  // Uji 3 (Positif): IV (Initialization Vector) acak untuk enkripsi berulang
  const encrypted2 = await encryptMedicalRecord(originalText, testKey);
  console.assert(encrypted.iv !== encrypted2.iv, 'Test 3 Failed: IV must be unique via CSPRNG');

  // Uji 4 (Negatif): Dekripsi dengan Kunci Salah Harus GAGAL
  try {
    const wrongKey = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    await decryptMedicalRecord(encrypted, wrongKey);
    console.error('Test 4 Failed: Decryption with wrong key should throw an error!');
  } catch {
    console.log('Test 4 Passed (Negative Test): Decryption correctly rejected invalid key.');
  }
})();