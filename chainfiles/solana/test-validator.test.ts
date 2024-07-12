import { CFTestcontainers } from '@chainfile/testcontainers';
import { afterAll, beforeAll, describe, expect, it } from '@workspace/jest/globals';

import test from './test-validator.json';

const testcontainers = new CFTestcontainers(test);

beforeAll(async () => {
  await testcontainers.start();
});

afterAll(async () => {
  await testcontainers.stop();
});

describe('solana', () => {
  it('should rpc(getBlockHeight)', async () => {
    const response = await testcontainers.get('solana').rpc({
      method: 'getBlockHeight',
    });

    expect(response.status).toStrictEqual(200);
    expect(await response.json()).toMatchObject({
      result: 0,
    });
  });
});
