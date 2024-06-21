import { execSync, spawn } from 'node:child_process';

import { Chainfile } from '@chainfile/schema';
import { afterAll, beforeAll, describe, expect, it, jest } from '@workspace/jest/globals';
import waitFor from '@workspace/jest/wait-for';
import { Testing } from 'cdk8s';
import getPort from 'get-port';

import { version } from '../package.json';
import { CFChart } from './chart';

global.Date.now = jest.fn(() => new Date('2024-01-01T00:00:00Z').getTime());

afterAll(() => {
  jest.restoreAllMocks();
});

const bitcoin_mainnet: Chainfile = {
  caip2: 'bip122:000000000019d6689c085ae165831e93',
  name: 'Bitcoin Mainnet',
  params: {
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
  volumes: {
    data: {
      type: 'persistent',
      size: '600Gi',
      expansion: {
        startFrom: '2024-01-01',
        monthlyRate: '20Gi',
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
        cpu: 1,
        memory: 2048,
      },
      environment: {
        DISABLEWALLET: '1',
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
          mountPath: '/bitcoin/.bitcoin',
          subPath: 'bitcoind',
        },
      ],
    },
  },
};

describe('bitcoin_mainnet.json', () => {
  const app = Testing.app();
  const chart = new CFChart(app, 'bitcoin_mainnet.json', {
    chainfile: bitcoin_mainnet,
    params: {
      rpc_user: 'user',
      rpc_password: 'pass',
    },
    spec: {
      replicas: 2,
      exposes: [
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
  });
  const results = Testing.synth(chart);

  it('should have 3 objects', async () => {
    expect(results).toHaveLength(3);
  });

  it('should synth bitcoin_mainnet.json and match snapshot', async () => {
    expect(results).toMatchSnapshot();
  });

  it('should get labels', async () => {
    expect(chart.labels).toStrictEqual({
      bitcoind: 'true',
      caip2: 'bip122.000000000019d6689c085ae165831e93',
    });
  });

  it('should get serviceName', async () => {
    expect(chart.serviceName).toMatch(/bitcoin_mainnet.json-service-[0-9a-f]{8}/);
  });
});

describe.skip('repl', () => {
  // Convenient tests to repeatedly apply chart to observe behavior
  // Set to skip by default
  const cluster = 'repl';
  const app = Testing.app();
  const chart = new CFChart(app, cluster, {
    chainfile: bitcoin_mainnet,
    params: {
      rpc_user: 'user',
      rpc_password: 'pass',
    },
    spec: {
      replicas: 1,
      exposes: [
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
  });

  describe('cluster', () => {
    it('should create cluster', async () => {
      execSync(`kind create cluster --name ${cluster} --config kind.k8s.yaml`, { stdio: 'inherit' });
      execSync(`kind load docker-image docker.io/kylemanna/bitcoind:latest --name ${cluster}`, { stdio: 'inherit' });
      execSync(`kind load docker-image ghcr.io/vetumorg/chainfile-agent:${version} --name ${cluster}`, {
        stdio: 'inherit',
      });
    });

    it('should delete cluster', async () => {
      execSync(`kind delete cluster --name ${cluster}`, { stdio: 'inherit' });
    });
  });

  it('should apply chart', async () => {
    for (const resource of Testing.synth(chart)) {
      execSync(`kubectl apply --context kind-${cluster} -f -`, {
        input: JSON.stringify(resource),
        stdio: ['pipe', 'inherit', 'inherit'],
      });
    }
  });

  it('should delete chart', async () => {
    for (const resource of Testing.synth(chart)) {
      execSync(`kubectl delete --context kind-${cluster} -f -`, {
        input: JSON.stringify(resource),
        stdio: ['pipe', 'inherit', 'inherit'],
      });
    }
  });
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
    const chart = new CFChart(app, cluster, {
      chainfile: bitcoin_mainnet,
      params: {
        rpc_user: 'user',
        rpc_password: 'pass',
      },
      spec: {
        replicas: 1,
        exposes: [
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

    // This is a simple test to check if the pod is running.
    // Service routing can't actually be tested with kubectl port-forward.
    const forwarding = spawn('kubectl', ['port-forward', `service/${chart.serviceName}`, `${port}:http`], {
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
