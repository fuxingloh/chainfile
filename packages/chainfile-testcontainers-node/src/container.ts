import { Buffer } from 'node:buffer';
import { randomInt } from 'node:crypto';

import {
  Container,
  EndpointHttpAuthorization,
  EndpointHttpJsonRpc,
  EndpointHttpRest,
  ValueReference,
} from '@chainfile/schema';
import { AbstractStartedContainer, StartedTestContainer } from 'testcontainers';

export class ChainfileContainer extends AbstractStartedContainer {
  constructor(
    started: StartedTestContainer,
    protected container: Container,
    protected values: Record<string, string>,
  ) {
    super(started);
  }

  /**
   * Get the host port for a given endpoint name.
   * To make a request to the container, you need to use the host and the port.
   * The port is the port on the host machine that is mapped to the container port.
   * @param name of the endpoint to get
   */
  getHostPort(name: string): number {
    const endpoint = this.container.endpoints?.[name];
    if (endpoint === undefined) {
      throw new Error(`Port ${name} not found`);
    }
    return this.getMappedPort(endpoint.port);
  }

  private getEndpoint<E>(name: string): E {
    const endpoint = this.container.endpoints?.[name];
    if (endpoint === undefined) {
      throw new Error(`Endpoint: '${name}' not found.`);
    }
    return endpoint as E;
  }

  /**
   * Get the host endpoint for a given endpoint name.
   * @param name of the endpoint to get
   * @param host to use, defaults to the container host,
   * use `host.docker.internal` if you need to access the host from a container
   */
  getHostEndpoint(name: string, host = this.getHost()): string {
    const endpoint = this.getEndpoint<EndpointHttpJsonRpc | EndpointHttpRest>(name);
    const port = this.getMappedPort(endpoint.port);
    switch (endpoint.protocol) {
      case 'HTTP JSON-RPC 1.0':
      case 'HTTP JSON-RPC 2.0':
        return `http://${host}:${port}/${endpoint.path ?? ''}`;
      case 'HTTPS JSON-RPC 1.0':
      case 'HTTPS JSON-RPC 2.0':
        return `https://${host}:${port}/${endpoint.path ?? ''}`;
      case 'HTTP REST':
        return `http://${host}:${port}`;
      case 'HTTPS REST':
        return `https://${host}:${port}`;
      default:
        throw new Error(`Endpoint: '${name}' does not support getHostEndpoint()`);
    }
  }

  /**
   * Get the authorization headers for a given endpoint name.
   *
   * ### Usage Example
   *
   * Given you want to call a rpc method on a container that requires authorization:
   *
   * ```ts
   * const endpoint = container.getHostEndpoint('rpc');
   * const headers = container.getAuthorizationHeaders('rpc');
   * const response = await fetch(endpoint, {
   *   method: 'POST',
   *   headers: headers,
   *   body: JSON.stringify({
   *     jsonrpc: '2.0',
   *     method: 'rpc_method',
   *   })
   * })
   * ```
   *
   * @param name of the endpoint to get
   */
  getAuthHeaders(name: string): Record<string, string> {
    const endpoint = this.getEndpoint<EndpointHttpJsonRpc | EndpointHttpRest>(name);

    const getHttpAuthHeaders = (auth?: EndpointHttpAuthorization): Record<string, string> => {
      if (auth === undefined) {
        return {};
      }

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
    };

    switch (endpoint.protocol) {
      case 'HTTP JSON-RPC 1.0':
      case 'HTTPS JSON-RPC 1.0':
      case 'HTTP JSON-RPC 2.0':
      case 'HTTPS JSON-RPC 2.0':
      case 'HTTP REST':
      case 'HTTPS REST':
        return getHttpAuthHeaders(endpoint.authorization);
      default:
        throw new Error(`Endpoint: '${name}' does not support getAuthHeaders()`);
    }
  }

  async rpc(options: {
    method: string;
    params?: any[];
    headers?: Record<string, string>;
    endpoint?: string;
  }): Promise<Response> {
    const name = options.endpoint ?? 'rpc';
    const endpoint = this.container.endpoints?.[name];
    const protocol = (endpoint as EndpointHttpJsonRpc).protocol;
    switch (protocol) {
      default:
        throw new Error(`Unsupported protocol: ${protocol} for rpc()`);
      case 'HTTP JSON-RPC 1.0':
      case 'HTTPS JSON-RPC 1.0':
      case 'HTTP JSON-RPC 2.0':
      case 'HTTPS JSON-RPC 2.0':
    }

    const jsonRpcVersion = protocol.endsWith('2.0') ? '2.0' : '1.0';

    return await fetch(this.getHostEndpoint(name), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(name),
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
      throw new Error(`Endpoint not found, please define a '${options.endpoint}' endpoint to use fetch()`);
    }

    const protocol = (endpoint as EndpointHttpRest).protocol;
    switch (protocol) {
      default:
        throw new Error(`Unsupported protocol: ${protocol} for fetch()`);
      case 'HTTP REST':
      case 'HTTPS REST':
    }

    const scheme = protocol.startsWith('HTTPS') ? 'https' : 'http';
    const host = this.getHost();
    const port = this.getMappedPort(endpoint.port);
    return await fetch(`${scheme}://${host}:${port}${options.path}`, {
      method: options.method,
      headers: {
        ...this.getAuthHeaders(options.endpoint),
        ...(options.headers ?? {}),
      },
      body: options.body,
    });
  }

  private resolveValue(value: string | ValueReference): string {
    if (typeof value === 'string') {
      return value;
    }
    return this.values[value.$value] ?? '';
  }
}
