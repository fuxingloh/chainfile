import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';

import { ChainfileAgent, ChainfileContainer, ChainfileTestcontainers } from './index';

const definition = {
  id: 'bip122:0f9188f13cb7b2c71f2a335e3a4fc328/bitcoind:25.1',
  caip2: 'bip122:0f9188f13cb7b2c71f2a335e3a4fc328',
  name: 'Bitcoin Regtest',
  environment: {
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
  testcontainers = await ChainfileTestcontainers.start(definition);
});

afterAll(async () => {
  await testcontainers.stop();
});

describe('container', () => {
  let container: ChainfileContainer;

  beforeAll(() => {
    container = testcontainers.getContainer('bitcoind');
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

describe('chainfile-agent', () => {
  let agent: ChainfileAgent;

  beforeAll(() => {
    agent = testcontainers.getChainfileAgent();
  });

  it('should call GET /deployment', async () => {
    const result = await agent.getDeployment();
    expect(result).toMatchObject({
      deploymentId: testcontainers.getDeploymentId(),
      definitionId: definition.id,
      caip2: definition.caip2,
      name: definition.name,
    });
  });

  it('should call GET /definition', async () => {
    const result = await agent.getDefinition();
    const expected = {
      ...definition,
      $schema: undefined,
    };
    delete expected.$schema;
    expect(result).toMatchObject(expected);
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
