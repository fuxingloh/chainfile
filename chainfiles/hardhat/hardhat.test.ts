import { CFTestcontainers } from '@chainfile/testcontainers';
import { afterAll, beforeAll, describe, expect, it } from '@workspace/jest/globals';

import hardhat from './hardhat.json';

describe('default', () => {
  const testcontainers = new CFTestcontainers(hardhat);

  beforeAll(async () => {
    await testcontainers.start();
  });

  afterAll(async () => {
    await testcontainers.stop();
  });

  it('should rpc(eth_blockNumber)', async () => {
    const response = await testcontainers.get('hardhat').rpc({
      method: 'eth_blockNumber',
    });

    expect(response.status).toStrictEqual(200);
    expect(await response.json()).toMatchObject({
      result: '0x0',
    });
  });
});

describe('v2.22.3', () => {
  const testcontainers = new CFTestcontainers(hardhat, {
    version: '2.22.3',
  });

  beforeAll(async () => {
    await testcontainers.start();
  });

  afterAll(async () => {
    await testcontainers.stop();
  });

  it('should rpc(eth_blockNumber)', async () => {
    const response = await testcontainers.get('hardhat').rpc({
      method: 'eth_blockNumber',
    });

    expect(response.status).toStrictEqual(200);
    expect(await response.json()).toMatchObject({
      result: '0x0',
    });
  });
});
