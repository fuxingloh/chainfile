import { Chainfile } from '@chainfile/schema';
import { expect, it } from '@jest/globals';

import { Compose } from './compose';

it('should synth', async () => {
  const file: Chainfile = {
    $schema: 'https://chainfile.org/schema.json',
    caip2: 'eip155:1337',
    name: 'Ganache',
    env: {
      RPC_USER: {
        type: 'RandomBytes',
        length: 16,
        encoding: 'hex',
      },
      RPC_PASSWORD: {
        type: 'RandomBytes',
        length: 16,
        encoding: 'hex',
      },
      URL: {
        type: 'Value',
        value: 'http://${RPC_USER}:${RPC_PASSWORD}@ganache:8554',
      },
    },
    containers: {
      ganache: {
        image: 'docker.io/trufflesuite/ganache@sha256:c62c58290c28e24b427f74c6f597ff696257bd2d8e8d517ce4cf46b29b304a3f',
        source: 'https://github.com/trufflesuite/ganache',
        environment: {
          RPCUSER: {
            key: 'RPC_USER',
          },
          RPCPASSWORD: {
            key: 'RPC_PASSWORD',
          },
        },
        // Orchestration
        resources: {
          cpu: 0.25,
          memory: 256,
        },
        // Endpoints
        endpoints: {
          p2p: {
            port: 8555,
          },
          rpc: {
            port: 8545,
            protocol: 'HTTP JSON-RPC 2.0',
            authorization: {
              type: 'HttpBasic',
              username: {
                key: 'RPC_USER',
              },
              password: {
                key: 'RPC_PASSWORD',
              },
            },
            probes: {
              readiness: {
                params: [],
                method: 'eth_blockNumber',
                match: {
                  result: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        volumes: {
          persistent: {
            paths: ['/.ganache'],
            size: {
              initial: '1G',
              from: '2024-01-01',
              growth: '1G',
              rate: 'yearly',
            },
          },
        },
      },
    },
  };

  const compose = new Compose(file, 'suffix');
  expect(compose.synthCompose()).toMatchSnapshot();
  expect(compose.synthEnv().split('\n')).toStrictEqual([
    expect.stringMatching(/^RPC_USER=[0-9a-f]{32}$/),
    expect.stringMatching(/^RPC_PASSWORD=[0-9a-f]{32}$/),
    expect.stringMatching(/^URL=http:\/\/[0-9a-f]{32}:[0-9a-f]{32}@ganache:8554$/),
  ]);
});

it('should fail to synth with invalid chainfile', async () => {
  expect(() => new Compose({} as any)).toThrowError();
});

it('should have different suffix when using different Compose', async () => {
  const file: Chainfile = {
    $schema: 'https://chainfile.org/schema.json',
    caip2: 'eip155:1337',
    name: 'Ganache',
    containers: {
      ganache: {
        image: 'docker.io/trufflesuite/ganache@sha256:c62c58290c28e24b427f74c6f597ff696257bd2d8e8d517ce4cf46b29b304a3f',
        source: 'https://github.com/trufflesuite/ganache',
        resources: {
          cpu: 0.25,
          memory: 256,
        },
        endpoints: {},
      },
    },
  };

  const compose1 = new Compose(file);
  const compose2 = new Compose(file);
  expect(compose1.suffix).not.toEqual(compose2.suffix);
});
