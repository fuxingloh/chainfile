import { expect, it } from '@jest/globals';
import { ChainfileDefinition } from 'chainfile';

import { Synthesizer } from './synthesizer';

it('should fail to synthesize with invalid definition', async () => {
  expect(() => new Synthesizer({})).toThrowError();
});

it('should synthesize with valid definition', async () => {
  const definition: ChainfileDefinition = {
    id: 'eip155:1337/ganache:7.9.1',
    caip2: 'eip155:1337',
    name: 'Ganache',
    environment: {
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

  const synthesizer = new Synthesizer(definition);
  expect(synthesizer.synthCompose()).toMatchSnapshot();
  expect(synthesizer.synthEnv().split('\n')).toStrictEqual([
    expect.stringMatching(/^RPC_USER=[0-9a-f]{32}$/),
    expect.stringMatching(/^RPC_PASSWORD=[0-9a-f]{32}$/),
    expect.stringMatching(/^URL=http:\/\/[0-9a-f]{32}:[0-9a-f]{32}@ganache:8554$/),
    expect.stringMatching(/^CHAINFILE_DEPLOYMENT_ID=[0-9a-f]{16}$/),
  ]);
});

it('should have different deploymentId when using different Synthesizer', async () => {
  const definition: ChainfileDefinition = {
    id: 'eip155:1337/ganache:7.9.1',
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

  const synthesizer1 = new Synthesizer(definition);
  const synthesizer2 = new Synthesizer(definition);
  expect(synthesizer1.deploymentId).not.toEqual(synthesizer2.deploymentId);
});
