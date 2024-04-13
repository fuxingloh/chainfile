import { Buffer } from 'node:buffer';
import { randomInt } from 'node:crypto';

import {
  ContainerEndpointHttpAuthorization,
  ContainerEndpointHttpJsonRpc,
  ContainerEndpointHttpRest,
  KarfiaContainer,
  KarfiaEnvironmentReference,
} from 'karfia-definition';
import { AbstractStartedContainer, StartedTestContainer } from 'testcontainers';

export class KarfiaTestContainer extends AbstractStartedContainer {
  constructor(
    started: StartedTestContainer,
    protected container: KarfiaContainer,
    protected environment: Record<string, string>,
  ) {
    super(started);
  }

  getHostPort(name: string): number {
    const endpoint = this.container.endpoints[name];
    if (endpoint === undefined) {
      throw new Error(`Port ${name} not found`);
    }
    return this.getMappedPort(endpoint.port);
  }

  /**
   * Get the host endpoint for a given name.
   * @param {string} name of the endpoint to get
   * @param {string} host to use, defaults to the container host,
   * use `host.docker.internal` if you need to access the host from a container
   */
  getHostEndpoint(name: string, host = this.getHost()): string {
    const endpoint = this.container.endpoints?.[name];
    if (endpoint === undefined) {
      throw new Error(`Endpoint not found, please define a '${name}' endpoint to use rpc()`);
    }

    const protocol = (endpoint as any).protocol;
    switch (protocol) {
      default:
        throw new Error(`Unsupported protocol: ${protocol} for rpc()`);
      case 'HTTP JSON-RPC 1.0':
      case 'HTTPS JSON-RPC 1.0':
      case 'HTTP JSON-RPC 2.0':
      case 'HTTPS JSON-RPC 2.0':
    }

    const jsonRpc = endpoint as ContainerEndpointHttpJsonRpc;
    const scheme = jsonRpc.protocol.startsWith('HTTPS') ? 'https' : 'http';

    const hostPort = this.getMappedPort(endpoint.port);
    return `${scheme}://${host}:${hostPort}${jsonRpc.path ?? ''}`;
  }

  async rpc(options: {
    method: string;
    params?: any[];
    headers?: Record<string, string>;
    endpoint?: string;
  }): Promise<Response> {
    const name = options.endpoint ?? 'rpc';
    const hostEndpoint = this.getHostEndpoint(name);

    const endpoint = this.container.endpoints?.[name];
    const jsonRpc = endpoint as ContainerEndpointHttpJsonRpc;
    const jsonRpcVersion = jsonRpc.protocol.endsWith('2.0') ? '2.0' : '1.0';

    return await fetch(hostEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(jsonRpc.authorization ? this.getHttpAuthorizationHeaders(jsonRpc.authorization) : {}),
        ...(options.headers ?? {}),
      },
      body: JSON.stringify({
        jsonrpc: jsonRpcVersion,
        method: options.method,
        params: options.params,
        id: randomInt(0, 999999999999),
      }),
    });
  }

  async fetch(options: {
    method: string;
    path: string;
    endpoint: string;
    headers?: Record<string, string>;
    body?: any;
  }): Promise<Response> {
    const endpoint = this.container.endpoints?.[options.endpoint];
    if (endpoint === undefined) {
      throw new Error(`Endpoint not found, please define a '${options.endpoint}' endpoint to use api()`);
    }

    const protocol = (endpoint as any).protocol;
    switch (protocol) {
      default:
        throw new Error(`Unsupported protocol: ${protocol} for fetch()`);
      case 'HTTP REST':
      case 'HTTPS REST':
    }

    const rest = endpoint as ContainerEndpointHttpRest;
    const scheme = rest.protocol.startsWith('HTTPS') ? 'https' : 'http';

    const hostPort = this.getMappedPort(endpoint.port);
    const hostEndpoint = `${scheme}://${this.getHost()}:${hostPort}${options.path}`;
    const headers: Record<string, string> = {
      ...(rest.authorization ? this.getHttpAuthorizationHeaders(rest.authorization) : {}),
      ...(options.headers ?? {}),
    };

    return await fetch(hostEndpoint, {
      method: options.method,
      headers: headers,
      body: options.body,
    });
  }

  private getHttpAuthorizationHeaders(auth: ContainerEndpointHttpAuthorization): Record<string, string> {
    const type = auth.type;
    if (type === 'HttpBasic') {
      const username = this.resolveValue(auth.username);
      const password = this.resolveValue(auth.password);
      return {
        Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
      };
    } else if (type === 'HttpBearer') {
      const token = this.resolveValue(auth.token);
      return {
        Authorization: `Bearer ${token}`,
      };
    } else {
      throw new Error(`Unknown authorization type: ${type}`);
    }
  }

  private resolveValue(value: string | KarfiaEnvironmentReference): string {
    if (typeof value === 'string') {
      return value;
    }
    return this.environment[value.key] ?? '';
  }
}
