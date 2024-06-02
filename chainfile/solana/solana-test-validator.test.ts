import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { ChainfileContainer, ChainfileTestcontainers } from 'chainfile-testcontainers';

import solana from './solana-test-validator.json';

let testcontainers: ChainfileTestcontainers;

beforeAll(async () => {
  testcontainers = await ChainfileTestcontainers.start(solana);
});

afterAll(async () => {
  await testcontainers.stop();
});

describe('solana-test-validator', () => {
  let validator: ChainfileContainer;

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
