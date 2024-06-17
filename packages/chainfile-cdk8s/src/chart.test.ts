import { execSync, spawn } from 'node:child_process';

import { Chainfile } from '@chainfile/schema';
import { afterAll, beforeAll, describe, expect, it, jest } from '@workspace/jest/globals';
import waitFor from '@workspace/jest/wait-for';
import { Testing } from 'cdk8s';
import getPort from 'get-port';

import { version } from '../package.json';
import { ChainfileChart } from './chart';

const bitcoin_mainnet: Chainfile = {
  caip2: 'bip122:000000000019d6689c085ae165831e93',
  name: 'Bitcoin Mainnet',
  values: {
    rpc_user: {
      description: 'Username for RPC authentication',
      secret: true,
      default: {
        random: {
          bytes: 16,
          encoding: 'hex',
        },
      },
    },
    rpc_password: {
      description: 'Password for RPC authentication',
      secret: true,
      default: {
        random: {
          bytes: 16,
          encoding: 'hex',
        },
      },
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
        cpu: 1,
        memory: 2048,
      },
      environment: {
        DISABLEWALLET: '1',
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
};

it('should synth bitcoin_mainnet.json and match snapshot', async () => {
  const app = Testing.app();
  const chart = new ChainfileChart(app, 'bitcoin_mainnet.json', {
    chainfile: bitcoin_mainnet,
    values: {
      rpc_user: 'user',
      rpc_password: 'pass',
    },
    spec: {
      deployment: { replicas: 1 },
      service: {
        ports: [
          {
            name: 'http',
            port: 80,
            target: {
              container: 'bitcoind',
              endpoint: 'rpc',
            },
          },
        ],
      },
    },
  });
  const results = Testing.synth(chart);
  expect(results).toMatchSnapshot();
});

describe('kind (k8s-in-docker)', () => {
  jest.setTimeout(600000);

  const cluster = 'cf-bitcoin-main';
  beforeAll(() => {
    execSync(`kind create cluster --name ${cluster} --config kind.k8s.yaml`, { stdio: 'inherit' });
    // Preload images from local environment to speed up tests
    execSync('docker pull kylemanna/bitcoind:latest', { stdio: 'inherit' });
    execSync(`kind load docker-image docker.io/kylemanna/bitcoind:latest --name ${cluster}`, { stdio: 'inherit' });
    execSync(`kind load docker-image ghcr.io/vetumorg/chainfile-agent:${version} --name ${cluster}`, {
      stdio: 'inherit',
    });
  });

  afterAll(() => {
    execSync(`kind delete cluster --name ${cluster}`, { stdio: 'inherit' });
  });

  it('should deploy bitcoin_mainnet.json chart and connect to service', async () => {
    const app = Testing.app();
    const chart = new ChainfileChart(app, cluster, {
      chainfile: bitcoin_mainnet,
      values: {
        rpc_user: 'user',
        rpc_password: 'pass',
      },
      spec: {
        deployment: { replicas: 1 },
        service: {
          ports: [
            {
              port: 80,
              name: 'http',
              target: {
                container: 'bitcoind',
                endpoint: 'rpc',
              },
            },
          ],
        },
      },
    });

    // Synth and apply the chart resources
    for (const resource of Testing.synth(chart)) {
      execSync(`kubectl apply --context kind-${cluster} -f -`, {
        input: JSON.stringify(resource),
        stdio: ['pipe', 'inherit', 'inherit'],
      });
    }

    process.stdout.write(
      `Waiting for bitcoind pod to be ready. You can also run 'kubectl describe pods --context kind-${cluster}' to check the status.\n`,
    );
    execSync(`kubectl wait --context kind-${cluster} --for=condition=Ready pod -l bitcoind=true --timeout=600s`, {
      stdio: 'inherit',
    });

    const port = await getPort();
    const forwarding = spawn('kubectl', ['port-forward', 'service/cf-bitcoin-main-service-c884ebf6', `${port}:http`], {
      stdio: 'inherit',
    });

    // Wait for port-forward to be ready, 405 because this endpoint only accepts POST
    await waitFor(async () => {
      const response = await fetch(`http://localhost:${port}/`);
      expect(response.status).toBe(405);
    }, 10000);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const response = await fetch(`http://localhost:${port}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from('user:pass').toString('base64'),
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'getblockchaininfo',
        params: [],
        id: 1,
      }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      result: {
        chain: 'main',
      },
    });

    forwarding.kill('SIGTERM');
  });
});
