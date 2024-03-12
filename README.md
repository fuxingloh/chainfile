> This is an **experimental** project to explore testing
> and deploying blockchain nodes at scale with an emphasis on local development and testing with batteries
> included for shipping to the cloud.

Karfia is an open-source framework to define, test, deploy,
and scale blockchain nodes on container-orchestration platforms.

It packages complex blockchain nodes into a single definition that can be easily deployed
and managed on Container-capable platforms such as Kubernetes,
Docker Compose, and Testcontainers.

## Motivation

> Karfia (Καρφί, pronounced kar-fee) in Greek refers to a nail;

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

Karfia aims to solve this by restoring the simplicity of participating in the network,
regardless of purpose, scale, complexity, and tenancy,
to accelerate the adoption of blockchain technology.
