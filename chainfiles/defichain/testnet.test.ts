import { CFTestcontainers } from '@chainfile/testcontainers';
import { afterAll, beforeAll, describe, expect, it } from '@workspace/jest/globals';

import testnet from './testnet.json';

const testcontainers = new CFTestcontainers(testnet);

beforeAll(async () => {
  await testcontainers.start();
});

afterAll(async () => {
  await testcontainers.stop();
});

describe('defid', () => {
  it('should rpc(getblockchaininfo)', async () => {
    const response = await testcontainers.get('defid').rpc({
      method: 'getblockchaininfo',
    });

    expect(response.status).toStrictEqual(200);
    expect(await response.json()).toMatchObject({
      result: {
        chain: 'test',
      },
    });
  });
});
