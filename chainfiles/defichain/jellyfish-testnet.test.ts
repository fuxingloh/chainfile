import { CFContainer, CFTestcontainers } from '@chainfile/testcontainers';
import { afterAll, beforeAll, describe, expect, it } from '@workspace/jest/globals';

import testnet from './jellyfish-testnet.json';

const testcontainers = new CFTestcontainers(testnet);

beforeAll(async () => {
  await testcontainers.start();
});

afterAll(async () => {
  await testcontainers.stop();
});

describe('defid + whale', () => {
  let defid: CFContainer;
  let whale: CFContainer;

  beforeAll(() => {
    defid = testcontainers.get('defid');
    whale = testcontainers.get('whale');
  });

  it('should defid.rpc(getblockchaininfo)', async () => {
    const response = await defid.rpc({
      method: 'getblockchaininfo',
    });

    expect(response.status).toStrictEqual(200);
    expect(await response.json()).toMatchObject({
      result: {
        chain: 'test',
      },
    });
  });

  it('should whale.api(/v0/testnet/tokens)', async () => {
    const response = await whale.fetch({
      path: '/v0/testnet/tokens',
      method: 'GET',
      endpoint: 'api',
    });

    expect(response.status).toStrictEqual(200);
    expect(await response.json()).toMatchObject({
      data: expect.arrayContaining([
        expect.objectContaining({
          id: '0',
          symbol: 'DFI',
        }),
      ]),
    });
  });
});
