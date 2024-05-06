import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { KarfiaAgentContainer, KarfiaContainer, KarfiaTestcontainers } from 'karfia-testcontainers';

import definition from './defid.json';

let testcontainers: KarfiaTestcontainers;

beforeAll(async () => {
  testcontainers = await KarfiaTestcontainers.start(definition);
});

afterAll(async () => {
  await testcontainers.stop();
});

describe('defid', () => {
  let defid: KarfiaContainer;

  beforeAll(() => {
    defid = testcontainers.getContainer('defid');
  });

  it('should rpc getblockchaininfo', async () => {
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

  it('should rpc getblockcount', async () => {
    const response = await defid.rpc({
      method: 'getblockcount',
    });

    expect(response.status).toStrictEqual(200);

    expect(await response.json()).toMatchObject({
      result: 0,
    });
  });

  it('should rpc getblock', async () => {
    const response = await defid.rpc({
      method: 'getblock',
      params: ['279b1a87aedc7b9471d4ad4e5f12967ab6259926cd097ade188dfcf22ebfe72a', 2],
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
        hash: '279b1a87aedc7b9471d4ad4e5f12967ab6259926cd097ade188dfcf22ebfe72a',
        height: 0,
        mediantime: 1587883831,
        merkleroot: '03d771953b10d3506b3c3d9511e104d715dd29279be4b072ffc5218bb18adacf',
        mintedBlocks: 0,
        nTx: 4,
        size: 946,
        stakeModifier: '0000000000000000000000000000000000000000000000000000000000000000',
        strippedsize: 946,
        time: 1587883831,
        tx: [
          {
            hash: '38a428686f98876f3346b3ba878680006cb5b55dc2abb68e9b369b176c647ddd',
            hex: '01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff6b0004ffff001d01044c6146696e616e6369616c2054696d65732032332f4d61722f3230323020546865204665646572616c20526573657276652068617320676f6e652077656c6c20706173742074686520706f696e74206f6620e28098514520696e66696e697479e28099ffffffff090080472fd4e314001976a914ca1baaa66f1866d8e1f42a2a755146d05d4a15e688ac00a07523dfaa0f001976a914d267f9b812c711b7b1d7233e632734fed4d3a32e88ac008041d6902d04001976a9146fb1d2c70d6a629373ac0d7c35a24ffa44e8386e88ac008041d6902d04001976a91437383fade2e0c5294cc9161903434d154116e4ec88ac00c0a317ea710a0017a914fdc25443350c89dfd77a49edf81ca98ef6de37cf8700e0d10bf538050017a9145cfd3b116efa18a4a687f35e036e7e3c4ef06952870040689a9cfa160017a914dd831b15d23801e1126345b2c50fc8afd4b143808700001ebd508f530017a9146a8b2283692a5a3f9fb2ef235496e382bab584538700008f5ea8c7290017a9145c9ec04c37431f27a08d3da78287633a386b208a8700000000',
            locktime: 0,
            size: 454,
            txid: '38a428686f98876f3346b3ba878680006cb5b55dc2abb68e9b369b176c647ddd',
            version: 1,
            vin: [
              {
                coinbase:
                  '0004ffff001d01044c6146696e616e6369616c2054696d65732032332f4d61722f3230323020546865204665646572616c20526573657276652068617320676f6e652077656c6c20706173742074686520706f696e74206f6620e28098514520696e66696e697479e28099',
                sequence: 4294967295,
              },
            ],
            vout: [
              {
                n: 0,
                scriptPubKey: {
                  addresses: ['8ZWWN1nX8drxJBSMG1VS9jH4ciBSvA9nxp'],
                  asm: 'OP_DUP OP_HASH160 ca1baaa66f1866d8e1f42a2a755146d05d4a15e6 OP_EQUALVERIFY OP_CHECKSIG',
                  hex: '76a914ca1baaa66f1866d8e1f42a2a755146d05d4a15e688ac',
                  reqSigs: 1,
                  type: 'pubkeyhash',
                },
                value: 58800000,
              },
              {
                n: 1,
                scriptPubKey: {
                  addresses: ['8aGPBahDX4oAXx9okpGRzHPS3Td1pZaLgU'],
                  asm: 'OP_DUP OP_HASH160 d267f9b812c711b7b1d7233e632734fed4d3a32e OP_EQUALVERIFY OP_CHECKSIG',
                  hex: '76a914d267f9b812c711b7b1d7233e632734fed4d3a32e88ac',
                  reqSigs: 1,
                  type: 'pubkeyhash',
                },
                value: 44100000,
              },
              {
                n: 2,
                scriptPubKey: {
                  addresses: ['8RGSkdaft9EmSXXp6b2UFojwttfJ5BY29r'],
                  asm: 'OP_DUP OP_HASH160 6fb1d2c70d6a629373ac0d7c35a24ffa44e8386e OP_EQUALVERIFY OP_CHECKSIG',
                  hex: '76a9146fb1d2c70d6a629373ac0d7c35a24ffa44e8386e88ac',
                  reqSigs: 1,
                  type: 'pubkeyhash',
                },
                value: 11760000,
              },
              {
                n: 3,
                scriptPubKey: {
                  addresses: ['8L7qGjjHRa3Agks6incPomWCfLSMPYipmU'],
                  asm: 'OP_DUP OP_HASH160 37383fade2e0c5294cc9161903434d154116e4ec OP_EQUALVERIFY OP_CHECKSIG',
                  hex: '76a91437383fade2e0c5294cc9161903434d154116e4ec88ac',
                  reqSigs: 1,
                  type: 'pubkeyhash',
                },
                value: 11760000,
              },
              {
                n: 4,
                scriptPubKey: {
                  addresses: ['dcZ3NXrpbNWvx1rhiGvXStM6EQtHLc44c9'],
                  asm: 'OP_HASH160 fdc25443350c89dfd77a49edf81ca98ef6de37cf OP_EQUAL',
                  hex: 'a914fdc25443350c89dfd77a49edf81ca98ef6de37cf87',
                  reqSigs: 1,
                  type: 'scripthash',
                },
                value: 29400000,
              },
              {
                n: 5,
                scriptPubKey: {
                  addresses: ['dMty9CfknKEaXqJuSgYkvvyF6UB6ffrZXG'],
                  asm: 'OP_HASH160 5cfd3b116efa18a4a687f35e036e7e3c4ef06952 OP_EQUAL',
                  hex: 'a9145cfd3b116efa18a4a687f35e036e7e3c4ef0695287',
                  reqSigs: 1,
                  type: 'scripthash',
                },
                value: 14700000,
              },
              {
                n: 6,
                scriptPubKey: {
                  addresses: ['dZcY1ZNm5bkquz2J74smKqokuPoVpPvGWu'],
                  asm: 'OP_HASH160 dd831b15d23801e1126345b2c50fc8afd4b14380 OP_EQUAL',
                  hex: 'a914dd831b15d23801e1126345b2c50fc8afd4b1438087',
                  reqSigs: 1,
                  type: 'scripthash',
                },
                value: 64680000,
              },
              {
                n: 7,
                scriptPubKey: {
                  addresses: ['dP8dvN5pnwbsxFcfN9DyqPVZi1fVHicDd2'],
                  asm: 'OP_HASH160 6a8b2283692a5a3f9fb2ef235496e382bab58453 OP_EQUAL',
                  hex: 'a9146a8b2283692a5a3f9fb2ef235496e382bab5845387',
                  reqSigs: 1,
                  type: 'scripthash',
                },
                value: 235200000,
              },
              {
                n: 8,
                scriptPubKey: {
                  addresses: ['dMs1xeSGZbGnTJWqTwjR4mcjp2egpEXG6M'],
                  asm: 'OP_HASH160 5c9ec04c37431f27a08d3da78287633a386b208a OP_EQUAL',
                  hex: 'a9145c9ec04c37431f27a08d3da78287633a386b208a87',
                  reqSigs: 1,
                  type: 'scripthash',
                },
                value: 117600000,
              },
            ],
            vsize: 454,
            weight: 1816,
          },
          {
            hash: 'ec6d7185414fecccf2bc3aa58d668b6548ad6c48daa1ad6d33cea178a7a1f233',
            hex: '01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff00ffffffff0200ca9a3b000000001c6a1a4466547843012152b28329b25a32a0afcc64d68792cbcb16839000407a10f35a00001976a91460b706622bcb621fa99a52a1ae9efca70c67404c88ac00000000',
            locktime: 0,
            size: 122,
            txid: 'ec6d7185414fecccf2bc3aa58d668b6548ad6c48daa1ad6d33cea178a7a1f233',
            version: 1,
            vin: [
              {
                coinbase: '',
                sequence: 4294967295,
              },
            ],
            vout: [
              {
                n: 0,
                scriptPubKey: {
                  asm: 'OP_RETURN 4466547843012152b28329b25a32a0afcc64d68792cbcb168390',
                  hex: '6a1a4466547843012152b28329b25a32a0afcc64d68792cbcb168390',
                  type: 'nulldata',
                },
                value: 10,
              },
              {
                n: 1,
                scriptPubKey: {
                  addresses: ['8PuErAcazqccCVzRcc8vJ3wFaZGm4vFbLe'],
                  asm: 'OP_DUP OP_HASH160 60b706622bcb621fa99a52a1ae9efca70c67404c OP_EQUALVERIFY OP_CHECKSIG',
                  hex: '76a91460b706622bcb621fa99a52a1ae9efca70c67404c88ac',
                  reqSigs: 1,
                  type: 'pubkeyhash',
                },
                value: 1000000,
              },
            ],
            vsize: 122,
            weight: 488,
          },
          {
            hash: 'd8e47a9a0ed41e565264253cf265b71ec8b8535df1a4b15bf3b30cf86741cff1',
            hex: '01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff00ffffffff0200ca9a3b000000001c6a1a446654784301e54d32b49539a8b20ce9e4ff3c15c3012996f80c00407a10f35a00001976a914710a95d64b186e5377d37a3fca42959bb01e7d5f88ac00000000',
            locktime: 0,
            size: 122,
            txid: 'd8e47a9a0ed41e565264253cf265b71ec8b8535df1a4b15bf3b30cf86741cff1',
            version: 1,
            vin: [
              {
                coinbase: '',
                sequence: 4294967295,
              },
            ],
            vout: [
              {
                n: 0,
                scriptPubKey: {
                  asm: 'OP_RETURN 446654784301e54d32b49539a8b20ce9e4ff3c15c3012996f80c',
                  hex: '6a1a446654784301e54d32b49539a8b20ce9e4ff3c15c3012996f80c',
                  type: 'nulldata',
                },
                value: 10,
              },
              {
                n: 1,
                scriptPubKey: {
                  addresses: ['8RPZm7SVUNhGN1RgGY3R92rvRkZBwETrCX'],
                  asm: 'OP_DUP OP_HASH160 710a95d64b186e5377d37a3fca42959bb01e7d5f OP_EQUALVERIFY OP_CHECKSIG',
                  hex: '76a914710a95d64b186e5377d37a3fca42959bb01e7d5f88ac',
                  reqSigs: 1,
                  type: 'pubkeyhash',
                },
                value: 1000000,
              },
            ],
            vsize: 122,
            weight: 488,
          },
          {
            hash: 'dd6df6d393f1e6f653bdeb27c0367a718a5ef54dd158429ad26a1d91668693c0',
            hex: '01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff00ffffffff0200ca9a3b000000001c6a1a446654784301e891de58e96aebf73299a4d19b15def1ce6368f900407a10f35a00001976a9142fa9b97e3adb9f3ab9133b50be09680b373aeb7288ac00000000',
            locktime: 0,
            size: 122,
            txid: 'dd6df6d393f1e6f653bdeb27c0367a718a5ef54dd158429ad26a1d91668693c0',
            version: 1,
            vin: [
              {
                coinbase: '',
                sequence: 4294967295,
              },
            ],
            vout: [
              {
                n: 0,
                scriptPubKey: {
                  asm: 'OP_RETURN 446654784301e891de58e96aebf73299a4d19b15def1ce6368f9',
                  hex: '6a1a446654784301e891de58e96aebf73299a4d19b15def1ce6368f9',
                  type: 'nulldata',
                },
                value: 10,
              },
              {
                n: 1,
                scriptPubKey: {
                  addresses: ['8KRsoeCRKHUFFmAGGJbRBAgraXiUPUVuXn'],
                  asm: 'OP_DUP OP_HASH160 2fa9b97e3adb9f3ab9133b50be09680b373aeb72 OP_EQUALVERIFY OP_CHECKSIG',
                  hex: '76a9142fa9b97e3adb9f3ab9133b50be09680b373aeb7288ac',
                  reqSigs: 1,
                  type: 'pubkeyhash',
                },
                value: 1000000,
              },
            ],
            vsize: 122,
            weight: 488,
          },
        ],
        version: 1,
        versionHex: '00000001',
        weight: 3784,
      },
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
        defid: {
          ok: true,
        },
      },
      ok: true,
    });
  });
});
