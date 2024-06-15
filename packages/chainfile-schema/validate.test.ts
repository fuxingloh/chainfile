import { describe, expect, it } from '@jest/globals';

import { validate } from './validate';

it('should fail validate', async () => {
  expect(() => validate({})).toThrow();
});

it('should pass validate', async () => {
  validate({
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
          DISABLEWALLET: '0',
          RPCUSER: {
            $value: 'rpc_user',
          },
          RPCPASSWORD: {
            $value: 'rpc_password',
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
  });
});

describe('fail with duplicate ports', () => {
  it('should fail validate with duplicate ports in a single container', async () => {
    expect(() =>
      validate({
        caip2: 'bip122:0f9188f13cb7b2c71f2a335e3a4fc328',
        name: '1 Container',
        containers: {
          btc1: {
            image: 'docker.io/kylemanna/bitcoind',
            tag: 'latest',
            source: 'https://github.com/kylemanna/docker-bitcoind',
            endpoints: {
              p2p: {
                port: 8332,
              },
              rpc: {
                port: 8332,
                protocol: 'HTTP REST',
              },
            },
            resources: {
              cpu: 0.25,
              memory: 256,
            },
          },
        },
      }),
    ).toThrow('All ports in all containers must be unique.');
  });

  it('should fail validate with duplicate ports across container', async () => {
    expect(() =>
      validate({
        caip2: 'bip122:0f9188f13cb7b2c71f2a335e3a4fc328',
        name: '2 Containers',
        containers: {
          btc1: {
            image: 'docker.io/kylemanna/bitcoind',
            tag: 'latest',
            source: 'https://github.com/kylemanna/docker-bitcoind',
            endpoints: {
              p2p: {
                port: 18445,
              },
              rpc: {
                port: 8332,
                protocol: 'HTTP JSON-RPC 2.0',
              },
            },
            resources: {
              cpu: 0.25,
              memory: 256,
            },
          },
          btc2: {
            image: 'docker.io/kylemanna/bitcoind',
            tag: 'latest',
            source: 'https://github.com/kylemanna/docker-bitcoind',
            endpoints: {
              p2p: {
                port: 18445,
              },
              rpc: {
                port: 8332,
                protocol: 'HTTP JSON-RPC 2.0',
              },
            },
            resources: {
              cpu: 0.25,
              memory: 256,
            },
          },
        },
      }),
    ).toThrow('All ports in all containers must be unique.');
  });
});
