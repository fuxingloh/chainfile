import { CFContainer, CFTestcontainers } from '@chainfile/testcontainers';
import { afterAll, beforeAll, describe, expect, it } from '@workspace/jest/globals';

import regtest from './bitcoind-regtest.json';

const testcontainers = new CFTestcontainers(regtest);

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

  it('should rpc getblockchaininfo', async () => {
    const response = await bitcoind.rpc({
      method: 'getblockchaininfo',
    });

    expect(response.status).toStrictEqual(200);

    expect(await response.json()).toMatchObject({
      result: {
        bestblockhash: '0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206',
        chain: 'regtest',
        blocks: 0,
      },
    });
  });
});

describe('ord', () => {
  let ord: CFContainer;

  beforeAll(() => {
    ord = testcontainers.get('ord');
  });

  it('should get /sat/0', async () => {
    const response = await ord.fetch({
      endpoint: 'api',
      method: 'GET',
      path: '/sat/0',
      headers: {
        Accept: 'application/json',
      },
    });

    expect(await response.json()).toMatchObject({
      block: 0,
      number: 0,
      charms: ['coin', 'mythic'],
    });
  });
});
