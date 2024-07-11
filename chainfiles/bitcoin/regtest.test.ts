import { CFContainer, CFTestcontainers } from '@chainfile/testcontainers';
import { afterAll, beforeAll, describe, expect, it } from '@workspace/jest/globals';

import regtest from './regtest.json';

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

  it('should rpc(getblockchaininfo)', async () => {
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

  it('should rpc(getblockcount)', async () => {
    const response = await bitcoind.rpc({
      method: 'getblockcount',
    });

    expect(response.status).toStrictEqual(200);
    expect(await response.json()).toMatchObject({
      result: 0,
    });
  });

  it('should rpc(getblock)', async () => {
    const response = await bitcoind.rpc({
      method: 'getblock',
      params: ['0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206', 2],
    });

    expect(response.status).toStrictEqual(200);
    expect(await response.json()).toEqual({
      error: null,
      id: expect.any(Number),
      result: {
        bits: '207fffff',
        chainwork: '0000000000000000000000000000000000000000000000000000000000000002',
        confirmations: 1,
        difficulty: 4.656542373906925e-10,
        hash: '0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206',
        height: 0,
        mediantime: 1296688602,
        merkleroot: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
        nTx: 1,
        nonce: 2,
        size: 285,
        strippedsize: 285,
        time: 1296688602,
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

  it('should rpc(sendtoaddress)', async () => {
    const createwallet: any = await bitcoind
      .rpc({ method: 'createwallet', params: ['test'] })
      .then((res) => res.json());
    expect(createwallet).toMatchObject({ error: null });

    const getnewaddress: any = await bitcoind.rpc({ method: 'getnewaddress' }).then((res) => res.json());
    expect(getnewaddress).toMatchObject({ error: null, result: expect.any(String) });

    // Wait for coinbase maturity
    const generatetoaddress = await bitcoind
      .rpc({
        method: 'generatetoaddress',
        params: [101, getnewaddress.result],
      })
      .then((res) => res.json());
    expect(generatetoaddress).toMatchObject({ error: null });

    const sendtoaddress: any = await bitcoind
      .rpc({
        method: 'sendtoaddress',
        params: ['bcrt1q4u4nsgk6ug0sqz7r3rj9tykjxrsl0yy4d0wwte', 1.23456789],
      })
      .then((res) => res.json());

    expect(sendtoaddress).toMatchObject({
      error: null,
    });
  });
});
