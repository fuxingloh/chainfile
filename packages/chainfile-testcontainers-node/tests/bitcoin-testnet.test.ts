import { afterAll, beforeAll, describe, expect, it } from '@workspace/jest/globals';

import { CFContainer, CFTestcontainers } from '../src';
import testnet from './bitcoin-testnet.json';

const testcontainers = new CFTestcontainers(testnet);

beforeAll(async () => {
  await testcontainers.start();
});

afterAll(async () => {
  await testcontainers.stop();
});

describe('bitcoind', () => {
  let bitcoind: CFContainer;

  beforeAll(() => {
    bitcoind = testcontainers.get('bitcoind');
  });

  it('should rpc(getblockchaininfo)', async () => {
    const response = await bitcoind.rpc({
      method: 'getblockchaininfo',
    });

    expect(response.status).toStrictEqual(200);

    expect(await response.json()).toMatchObject({
      result: {
        bestblockhash: '0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206',
        chain: 'test',
        blocks: 0,
      },
    });
  });
});
