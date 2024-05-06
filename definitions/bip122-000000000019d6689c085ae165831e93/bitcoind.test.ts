import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { KarfiaAgentContainer, KarfiaContainer, KarfiaTestcontainers } from 'karfia-testcontainers';
import waitForExpect from 'wait-for-expect';

import definition from './bitcoind.json';

let testcontainers: KarfiaTestcontainers;

beforeAll(async () => {
  testcontainers = await KarfiaTestcontainers.start(definition);
});

afterAll(async () => {
  await testcontainers.stop();
});

describe('bitcoind', () => {
  let bitcoind: KarfiaContainer;

  beforeAll(() => {
    bitcoind = testcontainers.getContainer('bitcoind');
  });

  it('should get rpc port', async () => {
    const port = bitcoind.getHostPort('rpc');
    expect(port).toStrictEqual(expect.any(Number));
  });

  it('should rpc getblockchaininfo', async () => {
    const response = await bitcoind.rpc({
      method: 'getblockchaininfo',
    });

    expect(response.status).toStrictEqual(200);

    expect(await response.json()).toMatchObject({
      result: {
        bestblockhash: '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f',
        chain: 'main',
      },
    });
  });

  it('should rpc getblockcount', async () => {
    const response = await bitcoind.rpc({
      method: 'getblockcount',
    });

    expect(response.status).toStrictEqual(200);

    expect(await response.json()).toMatchObject({
      result: 0,
    });
  });

  it('should rpc getblock', async () => {
    const response = await bitcoind.rpc({
      method: 'getblock',
      params: ['000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f', 2],
    });

    expect(response.status).toStrictEqual(200);

    expect(await response.json()).toEqual({
      error: null,
      id: expect.any(Number),
      result: {
        bits: '1d00ffff',
        chainwork: '0000000000000000000000000000000000000000000000000000000100010001',
        confirmations: 1,
        difficulty: 1,
        hash: '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f',
        height: 0,
        mediantime: 1231006505,
        merkleroot: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
        nTx: 1,
        nonce: 2083236893,
        size: 285,
        strippedsize: 285,
        time: 1231006505,
        tx: [
          {
            hash: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
            hex: '01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff4d04ffff001d0104455468652054696d65732030332f4a616e2f32303039204368616e63656c6c6f72206f6e206272696e6b206f66207365636f6e64206261696c6f757420666f722062616e6b73ffffffff0100f2052a01000000434104678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5fac00000000',
            locktime: 0,
            size: 204,
            txid: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
            version: 1,
            vin: [
              {
                coinbase:
                  '04ffff001d0104455468652054696d65732030332f4a616e2f32303039204368616e63656c6c6f72206f6e206272696e6b206f66207365636f6e64206261696c6f757420666f722062616e6b73',
                sequence: 4294967295,
              },
            ],
            vout: [
              {
                n: 0,
                scriptPubKey: {
                  asm: '04678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5f OP_CHECKSIG',
                  desc: 'pk(04678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5f)#vlz6ztea',
                  hex: '4104678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5fac',
                  type: 'pubkey',
                },
                value: 50,
              },
            ],
            vsize: 204,
            weight: 816,
          },
        ],
        version: 1,
        versionHex: '00000001',
        weight: 1140,
      },
    });
  });

  describe.skip('synchronization', () => {
    // Takes too long to run and is not deterministic
    beforeAll(async () => {
      await waitForExpect(async () => {
        const response = await bitcoind.rpc({
          method: 'getblockcount',
          params: [],
        });

        const result = ((await response.json()) as any).result;
        expect(result).toBeGreaterThan(1);
      }, 30000);
    });

    it('should bitcoind.rpc getblock(1)', async () => {
      const response = await bitcoind.rpc({
        method: 'getblock',
        params: ['00000000839a8e6886ab5951d76f411475428afc90947ee320161bbf18eb6048'],
      });

      expect(response.status).toStrictEqual(200);
      expect(await response.json()).toEqual({});
    });
  });
});

describe('karfia-agent', () => {
  let agent: KarfiaAgentContainer;

  beforeAll(() => {
    agent = testcontainers.getKarfiaAgent();
  });

  it('should get karfia-agent/deployment', async () => {
    const result = await agent.getDeployment();
    expect(result).toMatchObject({
      deploymentId: testcontainers.getDeploymentId(),
      definitionId: definition.id,
      caip2: definition.caip2,
      name: definition.name,
    });
  });

  it('should get karfia-agent/definition', async () => {
    const result = await agent.getDefinition();
    const expected = {
      ...definition,
      $schema: undefined,
    };
    delete expected.$schema;
    expect(result).toMatchObject(expected);
  });

  it('should get karfia-agent/probes/startup', async () => {
    const response = await agent.probe('startup');
    expect(response.status).toStrictEqual(200);
    expect(await response.json()).toMatchObject({
      ok: true,
    });
  });

  it('should get karfia-agent/probes/liveness', async () => {
    const response = await agent.probe('liveness');
    expect(response.status).toStrictEqual(200);
    expect(await response.json()).toMatchObject({
      ok: true,
    });
  });

  it('should get karfia-agent/probes/readiness', async () => {
    const response = await agent.probe('readiness');
    expect(response.status).toStrictEqual(200);
    expect(await response.json()).toMatchObject({
      containers: {
        bitcoind: {
          ok: true,
        },
      },
      ok: true,
    });
  });
});
