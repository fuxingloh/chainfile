import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { KarfiaContainer, KarfiaTestcontainers } from 'karfia-testcontainers';

import definition from './ganache.json';

let testcontainers: KarfiaTestcontainers;

beforeAll(async () => {
  testcontainers = await KarfiaTestcontainers.start(definition);
});

afterAll(async () => {
  await testcontainers.stop();
});

describe('ganache', () => {
  let ganache: KarfiaContainer;

  beforeAll(() => {
    ganache = testcontainers.getContainer('ganache');
  });

  it('should rpc(eth_blockNumber)', async () => {
    const response = await ganache.rpc({
      method: 'eth_blockNumber',
    });

    expect(response.status).toStrictEqual(200);

    expect(await response.json()).toMatchObject({
      result: '0x0',
    });
  });
});
