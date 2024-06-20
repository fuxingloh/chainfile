# @chainfile/cdk8s

This package contains the CDK8s application that deploys the Chainfile application to a Kubernetes cluster.

## Local Development

You can test kubernetes locally with Kubernetes-in-Docker (kind).
Kind literally runs Kubernetes in Docker containers where each container is a node in the cluster.
Allowing you to test complex Kubernetes configurations locally.
To install `kind` on macOS and set up a cluster, run the following commands:

```bash
brew install kind
kind create cluster --name cdk8s
```

To synth and deploy to the local cluster, run the following commands:

```bash
turbo synth
kubectl apply --context kind-cdk8s -f [file_name].k8s.yaml
```

Other Add-Ons:

<details>
<summary>Metrics Server</summary>

```shell
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/high-availability-1.21+.yaml
```

</details>
