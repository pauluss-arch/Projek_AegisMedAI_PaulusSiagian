import assert from 'node:assert/strict';
import { test } from 'node:test';
import { diseases } from '../../mock/diseasesData.ts';
import { diseaseRecordSchema } from './disease.ts';

test('all disease catalog seed records satisfy the persisted record schema', () => {
  for (const disease of diseases) {
    assert.deepEqual(diseaseRecordSchema.parse(disease), disease);
  }
});
