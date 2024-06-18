import { Chainfile } from '@chainfile/schema';
import { afterAll, beforeAll, describe, expect, it } from '@workspace/jest/globals';

import { AgentContainer } from './agent';
import { ChainfileTestcontainers } from './testcontainers';

const chainfile: Chainfile = {
  $schema: 'https://chainfile.org/schema.json',
  caip2: 'bip122:0f9188f13cb7b2c71f2a335e3a4fc328',
  name: 'Bitcoin Regtest',
  values: {
    rpc_user: 'user',
    rpc_password: 'password',
  },
  containers: {
    bitcoind: {
      image: 'docker.io/kylemanna/bitcoind',
      tag: 'latest',
      source: 'https://github.com/kylemanna/docker-bitcoind',
      endpoints: {
        rpc: {
          port: 8332,
          protocol: 'HTTP JSON-RPC 2.0',
          authorization: {
            type: 'HttpBasic',
            username: {
              $value: 'rpc_user',
            },
            password: {
              $value: 'rpc_password',
            },
          },
          probes: {
            readiness: {
              method: 'getblockchaininfo',
              params: [],
              match: {
                result: {
                  type: 'object',
                  properties: {
                    blocks: {
                      type: 'number',
                    },
                  },
                  required: ['blocks'],
                },
              },
            },
          },
        },
      },
      resources: {
        cpu: 0.25,
        memory: 256,
      },
      environment: {
        REGTEST: '1',
        RPCUSER: {
          $value: 'rpc_user',
        },
        RPCPASSWORD: {
          $value: 'rpc_password',
        },
      },
    },
  },
};

describe('testcontainers.start()', () => {
  const testcontainers = new ChainfileTestcontainers(chainfile);

  beforeAll(async () => {
    await testcontainers.start();
  });

  afterAll(async () => {
    await testcontainers.stop();
  });

  describe('container', () => {
    it('should get rpc port', async () => {
      const port = testcontainers.get('bitcoind').getHostPort('rpc');
      expect(port).toStrictEqual(expect.any(Number));
    });

    it('should rpc(getblockchaininfo)', async () => {
      const response = await testcontainers.get('bitcoind').rpc({
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

  describe('agent', () => {
    let agent: AgentContainer;

    beforeAll(() => {
      agent = testcontainers.getAgent();
    });

    it('should call GET /chainfile', async () => {
      const result = await agent.getChainfile();
      expect(result).toEqual(chainfile);
    });

    it('should call GET /probes/startup', async () => {
      const response = await agent.probe('startup');
      expect(response.status).toStrictEqual(200);
      expect(await response.json()).toMatchObject({
        ok: true,
      });
    });

    it('should call GET /probes/liveness', async () => {
      const response = await agent.probe('liveness');
      expect(response.status).toStrictEqual(200);
      expect(await response.json()).toMatchObject({
        ok: true,
      });
    });

    it('should call GET /probes/readiness', async () => {
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
});

describe('new ChainfileTestcontainers()', () => {
  it('should have different suffix', async () => {
    const file: Chainfile = {
      $schema: 'https://chainfile.org/schema.json',
      caip2: 'eip155:1337',
      name: 'Ganache',
      containers: {
        ganache: {
          image: 'docker.io/trufflesuite/ganache',
          tag: 'v7.9.2',
          source: 'https://github.com/trufflesuite/ganache',
          resources: {
            cpu: 0.25,
            memory: 256,
          },
          endpoints: {},
        },
      },
    };

    const test1 = new ChainfileTestcontainers(file);
    const test2 = new ChainfileTestcontainers(file);
    expect(test1.suffix).not.toEqual(test2.suffix);
  });
});
