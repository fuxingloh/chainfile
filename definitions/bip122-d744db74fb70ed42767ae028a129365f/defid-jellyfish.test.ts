import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { KarfiaAgentContainer, KarfiaContainer, KarfiaTestcontainers } from 'karfia-testcontainers';

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

describe('karfia-agent', () => {
  let agent: KarfiaAgentContainer;

  beforeAll(() => {
    agent = testcontainers.getKarfiaAgent();
  });

  it('should Probe.Readiness', async () => {
    const response = await agent.probe('Readiness');
    expect(response.status).toStrictEqual(200);
    expect(await response.json()).toMatchObject({
      containers: {
        defid: {
          ok: true,
        },
        whale: {
          ok: true,
        },
      },
      ok: true,
    });
  });
});
