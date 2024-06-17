# @chainfile/cdk8s

This package contains the CDK8s application that deploys the Chainfile application to a Kubernetes cluster.

## Contributing Guidelines

You need to install `kind` to run the tests. You can install it with the following command:

```shell
brew install kind
```

### Setting up a kind cluster for local development

```shell
kind create cluster --config kind.k8s.yaml
```

Optionally, you can install the Kubernetes Dashboard to monitor the cluster for better visibility:

```shell
# Add the Kubernetes Dashboard Helm repository
helm repo add kubernetes-dashboard https://kubernetes.github.io/dashboard/
# Install the Kubernetes Dashboard
helm upgrade --install kubernetes-dashboard kubernetes-dashboard/kubernetes-dashboard --create-namespace --namespace kubernetes-dashboard
# Get the token to access the Kubernetes Dashboard
kubectl create serviceaccount dashboard
kubectl create clusterrolebinding dashboard-admin --clusterrole=cluster-admin --serviceaccount=default:dashboard
kubectl create token dashboard
# Start the proxy and access the Kubernetes Dashboard on https://localhost:8443
kubectl -n kubernetes-dashboard port-forward svc/kubernetes-dashboard-kong-proxy 8443:443
```
