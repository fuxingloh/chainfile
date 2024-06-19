import { afterAll, beforeAll, describe, expect, it } from '@workspace/jest/globals';

import { CFContainer, CFTestcontainers } from '../src';
import solana from './solana-test-validator.json';

const testcontainers = new CFTestcontainers(solana);

beforeAll(async () => {
  await testcontainers.start();
});

afterAll(async () => {
  await testcontainers.stop();
});

describe('solana-test-validator', () => {
  let validator: CFContainer;

  beforeAll(() => {
    validator = testcontainers.get('solana-test-validator');
  });

  it('should rpc(getBlockHeight)', async () => {
    const response = await validator.rpc({
      method: 'getBlockHeight',
    });

    expect(response.status).toStrictEqual(200);

    expect(await response.json()).toMatchObject({
      result: 0,
    });
  });
});
