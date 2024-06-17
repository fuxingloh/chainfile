import { Chainfile } from '@chainfile/schema';
import { expect, it } from '@workspace/jest/globals';

import { createCaller } from './_app';

const chainfile: Chainfile = {
  $schema: 'https://chainfile.org/schema.json',
  caip2: 'bip122:0f9188f13cb7b2c71f2a335e3a4fc328',
  name: 'Bitcoin Regtest',
  values: {
    rpc_user: 'agent',
    rpc_password: 'agent',
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

const caller = createCaller({
  chainfile: chainfile,
  values: {},
});

it('should getChainfile', async () => {
  const result = await caller.getChainfile();
  expect(result).toEqual(JSON.parse(JSON.stringify(chainfile)));
});
