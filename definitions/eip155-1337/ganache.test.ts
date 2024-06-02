import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { ChainfileContainer, ChainfileTestcontainers } from 'chainfile-testcontainers';

import ganache from './ganache.json';

let testcontainers: ChainfileTestcontainers;

beforeAll(async () => {
  testcontainers = await ChainfileTestcontainers.start(ganache);
});

afterAll(async () => {
  await testcontainers.stop();
});

describe('ganache', () => {
  let ganache: ChainfileContainer;

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
