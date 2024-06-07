import { Chainfile } from '@chainfile/schema';
import { expect, it } from '@jest/globals';

import { Compose } from './compose';

it.each([
  {
    $schema: 'https://chainfile.org/schema.json',
    caip2: 'eip155:1337',
    name: 'Ganache',
    values: {
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
      URL: 'http://${RPC_USER}:${RPC_PASSWORD}@ganache:8554',
      GANACHE_VERSION: {
        type: 'Inject',
        name: 'GANACHE_VERSION',
        default: 'v7.9.2',
      },
    },
    containers: {
      ganache: {
        image: 'docker.io/trufflesuite/ganache',
        tag: {
          $value: 'GANACHE_VERSION',
        },
        source: 'https://github.com/trufflesuite/ganache',
        environment: {
          RPCUSER: {
            $value: 'RPC_USER',
          },
          RPCPASSWORD: {
            $value: 'RPC_PASSWORD',
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
                $value: 'RPC_USER',
              },
              password: {
                $value: 'RPC_PASSWORD',
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
  },
  {
    $schema: 'https://chainfile.org/schema.json',
    caip2: 'bip122:0f9188f13cb7b2c71f2a335e3a4fc328',
    name: 'Bitcoin Regtest',
    values: {
      RPC_USER: 'user',
      RPC_PASSWORD: 'password',
    },
    containers: {
      bitcoind: {
        image: 'docker.io/kylemanna/bitcoind',
        tag: 'latest',
        source: 'https://github.com/kylemanna/docker-bitcoind',
        command: ['btc_oneshot', '-fallbackfee=0.00000200', '-rpcbind=:8332', '-rpcallowip=0.0.0.0/0'],
        endpoints: {
          p2p: {
            port: 18445,
          },
          rpc: {
            port: 8332,
            protocol: 'HTTP JSON-RPC 2.0',
            authorization: {
              type: 'HttpBasic',
              username: {
                $value: 'RPC_USER',
              },
              password: {
                $value: 'RPC_PASSWORD',
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
          DISABLEWALLET: '0',
          RPCUSER: {
            $value: 'RPC_USER',
          },
          RPCPASSWORD: {
            $value: 'RPC_PASSWORD',
          },
        },
        volumes: {
          persistent: {
            paths: ['/bitcoin/.bitcoin'],
            size: '250M',
          },
        },
      },
    },
  },
  {
    $schema: 'https://chainfile.org/schema.json',
    caip2: 'bip122:000000000019d6689c085ae165831e93',
    name: 'Bitcoin Mainnet',
    values: {
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
    },
    containers: {
      bitcoind: {
        image: 'docker.io/kylemanna/bitcoind',
        tag: 'latest',
        source: 'https://github.com/kylemanna/docker-bitcoind',
        endpoints: {
          p2p: {
            port: 8333,
          },
          rpc: {
            port: 8332,
            protocol: 'HTTP JSON-RPC 2.0',
            authorization: {
              type: 'HttpBasic',
              username: {
                $value: 'RPC_USER',
              },
              password: {
                $value: 'RPC_PASSWORD',
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
          cpu: 1,
          memory: 2048,
        },
        environment: {
          DISABLEWALLET: '1',
          RPCUSER: {
            $value: 'RPC_USER',
          },
          RPCPASSWORD: {
            $value: 'RPC_PASSWORD',
          },
        },
        volumes: {
          persistent: {
            paths: ['/bitcoin/.bitcoin'],
            size: {
              initial: '600G',
              from: '2024-01-01',
              growth: '20G',
              rate: 'monthly',
            },
          },
        },
      },
    },
  },
])('should synth compose $name', async (chainfile: any) => {
  const compose = new Compose(chainfile, {}, 'suffix');
  expect(compose.synthCompose()).toMatchSnapshot();
});

it('should synth env', async () => {
  const chainfile: Chainfile = {
    $schema: 'https://chainfile.org/schema.json',
    caip2: 'eip155:1337',
    name: 'Ganache',
    values: {
      URL: 'http://${RPC_USER}:${RPC_PASSWORD}@ganache:8554',
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
    },
    containers: {
      ganache: {
        image: 'docker.io/trufflesuite/ganache',
        tag: 'v7.9.2',
        source: 'https://github.com/trufflesuite/ganache',
        environment: {
          RPCUSER: {
            $value: 'RPC_USER',
          },
          RPCPASSWORD: {
            $value: 'RPC_PASSWORD',
          },
        },
        resources: {
          cpu: 0.25,
          memory: 256,
        },
      },
    },
  };
  const compose = new Compose(chainfile, {}, 'suffix');
  expect(compose.synthDotEnv().split('\n')).toStrictEqual([
    'URL=http://${RPC_USER}:${RPC_PASSWORD}@ganache:8554',
    expect.stringMatching(/^RPC_USER=[0-9a-f]{32}$/),
    expect.stringMatching(/^RPC_PASSWORD=[0-9a-f]{32}$/),
  ]);
});

it('should fail to synth with invalid chainfile', async () => {
  expect(() => new Compose({} as any, {})).toThrowError();
});

it('should have different suffix when using different Compose', async () => {
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

  const compose1 = new Compose(file, {});
  const compose2 = new Compose(file, {});
  expect(compose1.suffix).not.toEqual(compose2.suffix);
});
