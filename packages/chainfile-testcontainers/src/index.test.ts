import { Chainfile } from '@chainfile/schema';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';

import { AgentContainer, ChainfileContainer, ChainfileTestcontainers } from './index';

const chainfile: Chainfile = {
  $schema: 'https://chainfile.org/schema.json',
  caip2: 'bip122:0f9188f13cb7b2c71f2a335e3a4fc328',
  name: 'Bitcoin Regtest',
  env: {
    RPC_USER: {
      type: 'Value',
      value: 'chainfile',
    },
    RPC_PASSWORD: {
      type: 'Value',
      value: 'chainfile',
    },
  },
  containers: {
    bitcoind: {
      image: 'docker.io/kylemanna/bitcoind@sha256:1492fa0306cb7eb5de8d50ba60367cff8d29b00b516e45e93e05f8b54fa2970e',
      source: 'https://github.com/kylemanna/docker-bitcoind',
      endpoints: {
        rpc: {
          port: 8332,
          protocol: 'HTTP JSON-RPC 2.0',
          authorization: {
            type: 'HttpBasic',
            username: 'RPC_USER',
            password: 'RPC_PASSWORD',
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
        RPCUSER: 'RPC_USER',
        RPCPASSWORD: 'RPC_PASSWORD',
      },
    },
  },
};

let testcontainers: ChainfileTestcontainers;

beforeAll(async () => {
  testcontainers = await ChainfileTestcontainers.start(chainfile);
});

afterAll(async () => {
  await testcontainers.stop();
});

describe('bitcoind', () => {
  let container: ChainfileContainer;

  beforeAll(() => {
    container = testcontainers.get('bitcoind');
  });

  it('should get rpc port', async () => {
    const port = container.getHostPort('rpc');
    expect(port).toStrictEqual(expect.any(Number));
  });

  it('should rpc getblockchaininfo', async () => {
    const response = await container.rpc({
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
