import { randomBytes } from 'node:crypto';

import { expect, it } from '@jest/globals';
import { Chainfile } from 'chainfile/schema';

import { createCaller } from './_app';

const chainfile: Chainfile = {
  caip2: 'bip122:0f9188f13cb7b2c71f2a335e3a4fc328',
  name: 'Bitcoin Regtest',
  env: {
    RPC_USER: {
      type: 'Value',
      value: 'agent',
    },
    RPC_PASSWORD: {
      type: 'Value',
      value: 'agent',
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

const deploymentId = randomBytes(8).toString('hex');

const caller = createCaller({
  chainfile: chainfile,
  deploymentId: deploymentId,
});

it('should call Agent.GetDeployment', async () => {
  const result = await caller.Agent.GetDeployment();
  expect(result).toStrictEqual({
    caip2: 'bip122:0f9188f13cb7b2c71f2a335e3a4fc328',
    deploymentId: deploymentId,
    name: 'Bitcoin Regtest',
  });
});

it('should call Agent.GetChainfile', async () => {
  const result = await caller.Agent.GetChainfile();
  expect(result).toEqual(JSON.parse(JSON.stringify(chainfile)));
});
