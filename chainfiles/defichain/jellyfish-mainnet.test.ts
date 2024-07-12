import { CFContainer, CFTestcontainers } from '@chainfile/testcontainers';
import { afterAll, beforeAll, describe, expect, it } from '@workspace/jest/globals';

import mainnet from './jellyfish-mainnet.json';

const testcontainers = new CFTestcontainers(mainnet);

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
        bestblockhash: '279b1a87aedc7b9471d4ad4e5f12967ab6259926cd097ade188dfcf22ebfe72a',
        chain: 'main',
        blocks: 0,
      },
    });
  });

  it('should whale.api(/v0/mainnet/tokens)', async () => {
    const response = await whale.fetch({
      path: '/v0/mainnet/tokens',
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
