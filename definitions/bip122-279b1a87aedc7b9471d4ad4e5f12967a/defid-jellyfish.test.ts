import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { KarfiaContainer, KarfiaTestcontainers } from 'karfia-testcontainers';

import definition from './defid-jellyfish.json';

let testcontainers: KarfiaTestcontainers;

beforeAll(async () => {
  testcontainers = await KarfiaTestcontainers.start(definition);
});

afterAll(async () => {
  await testcontainers.stop();
});

describe('defid + whale', () => {
  let defid: KarfiaContainer;
  let whale: KarfiaContainer;

  beforeAll(() => {
    defid = testcontainers.getContainer('defid');
    whale = testcontainers.getContainer('whale');
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
