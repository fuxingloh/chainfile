import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { KarfiaContainer, KarfiaTestcontainers } from 'karfia-testcontainers';

import definition from './hardhat.json';

let testcontainers: KarfiaTestcontainers;

beforeAll(async () => {
  testcontainers = await KarfiaTestcontainers.start(definition);
});

afterAll(async () => {
  await testcontainers.stop();
});

describe('hardhat', () => {
  let hardhat: KarfiaContainer;

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
