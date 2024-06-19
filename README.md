<p align="center">
  <a href="https://github.com/vetumorg/chainfile">
    <h3 align="center">Chainfile</h3>
    <p align="center">Define, Test, Deploy, Scale<br>Blockchain</p>
  </a>
</p>

Chainfile is an open-source framework to define, test, deploy,
and scale blockchain nodes on container-orchestration platforms.

It packages complex blockchain nodes into a single file that can be easily deployed
and managed on Container-capable platforms such as Kubernetes, Docker Compose, and Testcontainers.

1. **Define** once using a simple, non-turing-complete JSON schema that is easy to compose and maintain.
2. **Test** locally using Testcontainers to ensure your blockchain application works as expected.
3. **Deploy** anywhere using Docker Compose, Kubernetes, or any other container-orchestration platform.
4. **Scale** effortlessly with planet-scale Kubernetes constructs.

## Motivation

Not so long ago, we had a single binary called Bitcoin Core that we could easily run with a single command.
Having access to this single binary equated to having access to the node, wallet, and miner.
It was simple and easy to use.
If you had the binary and enough resources, you could run a full node that could do "everything".

Then came the era of Bitcoin forks, new binaries, and new commands.
Running a node is no longer as simple as typing `bitcoind` into the terminal.
You need to know which binary to run, which command to use, and which flag to set.

Soon enough, additional tools and capabilities were added to the mix.
You need to run a separate binary for the wallet, another for the miner, another for the indexer,
another for the consensus, another for the explorer, another for the API, and another for the RPC.

As the complexity grew, it alienated the democratization of the blockchain.
Running a node and participating in the network is no longer easy.
Most developers today, even those familiar with the blockchain,
rely on third-party providers to provide them with connectivity to the network.

Chainfile aims to solve this by restoring the simplicity of participating in the network,
regardless of purpose, scale, complexity, and tenancy,
to accelerate the adoption of blockchain technology.

## Features

### Define Once

```json
{
  "caip2": "eip155:1",
  "name": "Ethereum Mainnet (Geth + Lighthouse)"
}
```

### Test Locally

```js
import hardhat from '@chainfile/eip-155-31337/hardhat.json';

const testcontainers = new CFTestcontainers(hardhat);

beforeAll(async () => {
  await testcontainers.start();
});

afterAll(async () => {
  await testcontainers.stop();
});

it('should rpc(eth_blockNumber)', async () => {
  const response = await testcontainers.get('hardhat').rpc({
    method: 'eth_blockNumber',
  });

  expect(response.status).toStrictEqual(200);
  expect(await response.json()).toMatchObject({
    result: '0x0',
  });
});
```

### Deploy Anywhere

```bash
chainfile docker synth eip155:1/geth:1.13.5/lighthouse:4.5.0
cd eip155-1_geth-1.13.5_lighthouse-4.5.0
docker compose up
```

### Scale Effortlessly

```ts
import bitcoind from '@chainfile/bip122-0f9188f13cb7b2c71f2a335e3a4fc328/bitcoind.json';
import { getDefinitionLabels, ChainfileDeployment, ChainfileSecret, ChainfileService } from 'chainfile-cdk8s';

class BitcoinK8sChart extends Chart {
  constructor(scope: Construct) {
    super(scope, 'bitcoin');
    const labels = getDefinitionLabels(bitcoind);

    const secret = new ChainfileSecret(this, 'bitcoin', {
      chainfile: bitcoind,
      metadata: {
        name: 'bitcoin-runtime',
        labels: labels,
      },
    });

    new ChainfileDeployment(this, 'deployment', {
      secret: secret,
      chainfile: bitcoind,
      labels: labels,
      spec: { replicas: 1 },
    });

    new ChainfileService(this, 'service', {
      spec: {
        type: 'LoadBalancer',
        selector: labels,
      },
      exposes: [{ port: 8332, container: 'bitcoind', endpoint: 'rpc' }],
    });
  }
}
```

## License

This project is divided into two main parts, each with its own licensing:

- **`./packages`:** The source code for packages is licensed under the MIT License. For more details, see the [MIT License](./packages/LICENSE) file.
- **`./definitions`:** The definitions and related components are licensed under the Mozilla Public License 2.0 (MPL-2.0). For more information, refer to the [MPL-2.0 License](./definitions/LICENSE) file.

This dual-licensing approach best accommodates the usage of both the packages and the definitions,
ensuring flexibility for package users while protecting the integrity of the definitions.
Please ensure you review the license files for detailed terms and conditions.
