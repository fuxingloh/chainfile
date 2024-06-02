import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { ChainfileContainer, ChainfileTestcontainers } from 'chainfile-testcontainers';

import definition from './hardhat.json';

let testcontainers: ChainfileTestcontainers;

beforeAll(async () => {
  testcontainers = await ChainfileTestcontainers.start(definition);
});

afterAll(async () => {
  await testcontainers.stop();
});

describe('hardhat', () => {
  let hardhat: ChainfileContainer;

  beforeAll(() => {
    hardhat = testcontainers.getContainer('hardhat');
  });

  it('should rpc(eth_blockNumber)', async () => {
    const response = await hardhat.rpc({
      method: 'eth_blockNumber',
    });

    expect(response.status).toStrictEqual(200);

    expect(await response.json()).toMatchObject({
      result: '0x0',
    });
  });
});
