import { CFContainer, CFTestcontainers } from '@chainfile/testcontainers';
import { afterAll, beforeAll, describe, expect, it } from '@workspace/jest/globals';

import regtest from './jellyfish-regtest.json';

const testcontainers = new CFTestcontainers(regtest);

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
        bestblockhash: 'd744db74fb70ed42767ae028a129365fb4d7de54ba1b6575fb047490554f8a7b',
        chain: 'regtest',
        blocks: 0,
      },
    });
  });

  it('should whale.api(/v0/regtest/tokens)', async () => {
    const response = await whale.fetch({
      path: '/v0/regtest/tokens',
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
