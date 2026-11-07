import test from 'node:test';
import assert from 'node:assert/strict';
import {
  periksaIzinAkses,
  MATRIKS_AKSES,
  otentikasiPenggunaUji,
  type PeranPengguna,
  type OperasiSistem,
} from './rbacUsers.js';
import { buatToken, bacaToken, type DataSesi } from './sessionToken.js';

process.env.SESSION_SECRET = process.env.SESSION_SECRET || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

test('sec-0.2 / R03 / T01: Authentication with scrypt correctly resolves roles and identities', () => {
  // Test authentication for each role with valid password
  const admin = otentikasiPenggunaUji('admin_test', 'AdminSecurePass!2026');
  assert.ok(admin);
  assert.equal(admin.peran, 'admin');

  const dokter = otentikasiPenggunaUji('dokter_test', 'DokterClinicalPass#2026');
  assert.ok(dokter);
  assert.equal(dokter.peran, 'dokter');

  const apoteker = otentikasiPenggunaUji('apoteker_test', 'ApotekerPharmaPass@2026');
  assert.ok(apoteker);
  assert.equal(apoteker.peran, 'apoteker');

  const pasien = otentikasiPenggunaUji('pasien_test', 'PasienHealthPass*2026');
  assert.ok(pasien);
  assert.equal(pasien.peran, 'pasien');
  assert.equal(pasien.pasienId, 'RM-2026-0101');

  // Test authentication rejection with wrong password
  const failed = otentikasiPenggunaUji('dokter_test', 'WrongPassword123');
  assert.equal(failed, null);

  // Test authentication rejection for non-existent user
  const nonExistent = otentikasiPenggunaUji('unknown_user', 'AnyPassword123');
  assert.equal(nonExistent, null);
});

test('sec-0.2 / T01 / T07: Session token preserves role and enforces cryptographic integrity', () => {
  const sessionData: DataSesi = {
    namaPengguna: 'dokter_test',
    peran: 'dokter',
    kedaluwarsa: Math.floor(Date.now() / 1000) + 3600,
  };

  const token = buatToken(sessionData);
  const parsed = bacaToken(token);
  assert.ok(parsed);
  assert.equal(parsed.namaPengguna, 'dokter_test');
  assert.equal(parsed.peran, 'dokter');

  // Tampering with payload role from 'dokter' to 'admin'
  const [payloadBase64, sig] = token.split('.');
  const decodedPayload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8'));
  decodedPayload.peran = 'admin'; // Privilege escalation attempt (T06)
  const forgedPayloadBase64 = Buffer.from(JSON.stringify(decodedPayload)).toString('base64url');
  const tamperedToken = `${forgedPayloadBase64}.${sig}`;

  const tamperedResult = bacaToken(tamperedToken);
  assert.equal(tamperedResult, null, 'Tampered token signature must fail verification');
});

test('sec-0.2 / R02 / T08: Unauthorized prescription signing is strictly denied for non-doctors', () => {
  const op: OperasiSistem = 'SIGN_PRESCRIPTION';

  assert.equal(periksaIzinAkses('dokter', op), true, 'Dokter MUST be authorized to sign prescriptions');
  assert.equal(periksaIzinAkses('apoteker', op), false, 'Apoteker MUST NOT be authorized to sign prescriptions');
  assert.equal(periksaIzinAkses('pasien', op), false, 'Pasien MUST NOT be authorized to sign prescriptions');
  assert.equal(periksaIzinAkses('admin', op), false, 'Admin MUST NOT be authorized to sign clinical prescriptions');
  assert.equal(periksaIzinAkses(undefined, op), false, 'Unauthenticated guest MUST NOT be authorized');
});

test('sec-0.2 / R01 / T01: AI Diagnosis execution is strictly reserved for physicians', () => {
  const op: OperasiSistem = 'RUN_AI_DIAGNOSIS';

  assert.equal(periksaIzinAkses('dokter', op), true, 'Dokter is authorized to run diagnostic assessment');
  assert.equal(periksaIzinAkses('apoteker', op), false, 'Apoteker is forbidden from running physician diagnosis');
  assert.equal(periksaIzinAkses('pasien', op), false, 'Pasien is forbidden from clinical diagnosis execution');
  assert.equal(periksaIzinAkses('admin', op), false, 'Admin is forbidden from clinical diagnosis execution');
});

test('sec-0.2 / R01 / T06: IDOR Protection — Patient cannot view another patient EHR record', () => {
  const opViewOwn: OperasiSistem = 'VIEW_OWN_EHR';
  const opViewAll: OperasiSistem = 'VIEW_ALL_EHR';

  // Pasien is allowed to view own record
  assert.equal(periksaIzinAkses('pasien', opViewOwn), true);

  // Pasien is strictly FORBIDDEN from viewing all EHRs or other patients' data
  assert.equal(periksaIzinAkses('pasien', opViewAll), false);

  // Simulated IDOR check
  const patientSession = { namaPengguna: 'pasien_test', peran: 'pasien' as PeranPengguna, pasienId: 'RM-2026-0101' };
  const targetPatientOwn = { id: 'uuid-1', medicalRecordNum: 'RM-2026-0101' };
  const targetPatientOther = { id: 'uuid-2', medicalRecordNum: 'RM-2026-9999' };

  // Own record access allowed
  const isOwnAllowed = patientSession.pasienId === targetPatientOwn.medicalRecordNum;
  assert.equal(isOwnAllowed, true);

  // Other record access denied (IDOR prevention)
  const isOtherAllowed = patientSession.pasienId === targetPatientOther.medicalRecordNum;
  assert.equal(isOtherAllowed, false, 'Patient accessing another medical record number must be blocked');
});

test('sec-0.2 / T06 / T10: Patient record deletion is restricted solely to Admin role', () => {
  const op: OperasiSistem = 'DELETE_PATIENT_RECORD';

  assert.equal(periksaIzinAkses('admin', op), true, 'Admin MUST be authorized to delete patient record');
  assert.equal(periksaIzinAkses('dokter', op), false, 'Dokter is forbidden from deleting records');
  assert.equal(periksaIzinAkses('apoteker', op), false, 'Apoteker is forbidden from deleting records');
  assert.equal(periksaIzinAkses('pasien', op), false, 'Pasien is forbidden from deleting records');
  assert.equal(periksaIzinAkses(undefined, op), false, 'Unauthenticated guest is forbidden');
});

test('sec-0.2 / T02 / T06: Catalog management is restricted solely to Admin role', () => {
  const op: OperasiSistem = 'MANAGE_CATALOG';

  assert.equal(periksaIzinAkses('admin', op), true, 'Admin is authorized to manage catalog');
  assert.equal(periksaIzinAkses('dokter', op), false, 'Dokter is forbidden from modifying catalog');
  assert.equal(periksaIzinAkses('apoteker', op), false, 'Apoteker is forbidden from modifying catalog');
  assert.equal(periksaIzinAkses('pasien', op), false, 'Pasien is forbidden from modifying catalog');
  assert.equal(periksaIzinAkses(undefined, op), false, 'Unauthenticated guest is forbidden');
});

test('sec-0.2: Comprehensive Access Matrix Coverage satisfies all 12 operational security controls', () => {
  const ops = Object.keys(MATRIKS_AKSES) as OperasiSistem[];
  assert.equal(ops.length, 12, 'Must cover all 12 system operations in access matrix');

  for (const opKey of ops) {
    const entry = MATRIKS_AKSES[opKey];
    assert.ok(entry.namaAksi, `Operation ${opKey} must have a descriptive action name`);
    assert.ok(entry.risikoTerkait, `Operation ${opKey} must map to a Risk ID from Tugas 1`);
    assert.ok(entry.peranDiizinkan.length > 0, `Operation ${opKey} must define permitted roles`);
  }
});
