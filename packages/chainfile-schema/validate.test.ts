import { describe, expect, it } from '@workspace/jest/globals';

import { validate } from './validate';

it('should fail validate', async () => {
  expect(() => validate({})).toThrow();
});

it('should pass validate', async () => {
  validate({
    caip2: 'bip122:0f9188f13cb7b2c71f2a335e3a4fc328',
    name: 'Bitcoin Regtest',
    params: {
      rpc_user: 'user',
      rpc_password: 'password',
    },
    volumes: {
      data: {
        type: 'persistent',
        size: '250Mi',
      },
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
                $param: 'rpc_user',
              },
              password: {
                $param: 'rpc_password',
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
            $param: 'rpc_user',
          },
          RPCPASSWORD: {
            $param: 'rpc_password',
          },
        },
        mounts: [
          {
            volume: 'data',
            path: '/bitcoin/.bitcoin',
          },
        ],
      },
    },
  });
});

describe('fail with duplicate ports', () => {
  it('should fail validation with duplicate ports in a single container', async () => {
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

  it('should fail validation with duplicate ports across container', async () => {
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

describe('fail with missing volumes', () => {
  it('should fail validation with when volume[data] is missing', async () => {
    expect(() =>
      validate({
        caip2: 'bip122:0f9188f13cb7b2c71f2a335e3a4fc328',
        name: '1 Container',
        volumes: {
          database: {
            type: 'persistent',
            size: '1Gi',
          },
        },
        containers: {
          btc1: {
            image: 'docker.io/kylemanna/bitcoind',
            tag: 'latest',
            source: 'https://github.com/kylemanna/docker-bitcoind',
            endpoints: {},
            mounts: [{ volume: 'data', mountPath: '/data' }],
            resources: {
              cpu: 0.25,
              memory: 256,
            },
          },
        },
      }),
    ).toThrow('Volume data is not defined.');
  });

  it('should fail validation with when volumes is undefined', async () => {
    expect(() =>
      validate({
        caip2: 'bip122:0f9188f13cb7b2c71f2a335e3a4fc328',
        name: '1 Container',
        containers: {
          btc2: {
            image: 'docker.io/kylemanna/bitcoind',
            tag: 'latest',
            source: 'https://github.com/kylemanna/docker-bitcoind',
            endpoints: {},
            mounts: [{ volume: 'database', mountPath: '/data' }],
            resources: {
              cpu: 0.25,
              memory: 256,
            },
          },
        },
      }),
    ).toThrow('Volume database is not defined.');
  });
});
