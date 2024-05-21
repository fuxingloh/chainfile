import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { KarfiaContainer, KarfiaTestcontainers } from 'karfia-testcontainers';

import definition from './solana-test-validator.json';

let testcontainers: KarfiaTestcontainers;

beforeAll(async () => {
  testcontainers = await KarfiaTestcontainers.start(definition);
});

afterAll(async () => {
  await testcontainers.stop();
});

describe('solana-test-validator', () => {
  let validator: KarfiaContainer;

  beforeAll(() => {
    validator = testcontainers.getContainer('solana-test-validator');
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
