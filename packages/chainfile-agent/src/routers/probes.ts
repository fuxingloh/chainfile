import { Buffer } from 'node:buffer';
import { randomInt } from 'node:crypto';

import {
  Chainfile,
  Endpoint,
  EndpointHttpAuthorization,
  EndpointHttpJsonRpc,
  EndpointHttpRest,
  ParamReference,
} from '@chainfile/schema';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import debug0 from 'debug';
import { z } from 'zod';

import { publicProcedure, router } from '../trpc';

const debug = debug0('chainfile:agent');

const probeProcedure = publicProcedure
  .input(z.void())
  .output(
    z.object({
      ok: z.boolean(),
      containers: z.record(z.object({ ok: z.boolean(), raw: z.any() })),
    }),
  )
  .use((opts) => {
    return opts.next({
      ctx: {
        probes: new Probes(opts.ctx.chainfile, opts.ctx.params) as any,
      },
    });
  });

export const probesRouter = router({
  probeStartup: probeProcedure
    .meta({ openapi: { method: 'GET', path: '/probes/startup', tags: ['probes'] } })
    .query(async ({ ctx: { probes } }) => {
      return probes.get(ProbeType.startup);
    }),
  probeLiveness: probeProcedure
    .meta({ openapi: { method: 'GET', path: '/probes/liveness', tags: ['probes'] } })
    .query(async ({ ctx: { probes } }) => {
      return probes.get(ProbeType.liveness);
    }),
  probeReadiness: probeProcedure
    .meta({ openapi: { method: 'GET', path: '/probes/readiness', tags: ['probes'] } })
    .query(async ({ ctx: { probes } }) => {
      return probes.get(ProbeType.readiness);
    }),
});

enum ProbeType {
  startup = 'startup',
  liveness = 'liveness',
  readiness = 'readiness',
}

interface ProbeResponse {
  ok: boolean;
  raw?: any;
}

type ProbeFunction = () => Promise<ProbeResponse>;

class Probes {
  constructor(
    private readonly chainfile: Chainfile,
    private readonly params: Record<string, string>,
    private readonly ajv: Ajv = new Ajv(),
  ) {
    addFormats(this.ajv);
  }

  async get(probeType: ProbeType) {
    const probeFunctions = Object.entries(this.chainfile.containers).flatMap(
      ([name, container]): [string, ProbeFunction][] => {
        return Object.values(container.endpoints ?? {})
          .map((endpoint): [string, ProbeFunction] | undefined => {
            const func = this.createProbeFunction(name, endpoint, probeType);
            if (func === undefined) {
              return undefined;
            }
            return [name, func];
          })
          .filter((x): x is [string, ProbeFunction] => x !== undefined);
      },
    );

    const containers = await Promise.all(
      probeFunctions.map(async ([name, probeFunc]) => {
        const res = await probeFunc();
        return {
          name: name,
          ok: res.ok,
          raw: res.raw,
        };
      }),
    );

    const ok = containers.every(({ ok }) => ok);

    return {
      ok: ok,
      containers: containers.reduce<Record<string, ProbeResponse>>((acc, { name, ok, raw }) => {
        acc[name] = {
          ok: ok,
          raw: raw,
        };
        return acc;
      }, {}),
    };
  }

  private createProbeFunction(
    containerName: string,
    endpoint: Endpoint,
    probeType: ProbeType,
  ): ProbeFunction | undefined {
    const protocol = (endpoint as any).protocol;
    if (protocol === undefined) {
      return undefined;
    }

    switch (protocol) {
      case 'HTTP JSON-RPC 1.0':
      case 'HTTPS JSON-RPC 1.0':
      case 'HTTP JSON-RPC 2.0':
      case 'HTTPS JSON-RPC 2.0':
        return this.createProbeFunctionHttpJsonRpc(containerName, endpoint as EndpointHttpJsonRpc, probeType);
      case 'HTTP REST':
      case 'HTTPS REST':
        return this.createProbeFunctionHttp(containerName, endpoint as EndpointHttpRest, probeType);
      default:
        throw new Error(`Unknown protocol: ${protocol}`);
    }
  }

  private createProbeFunctionHttp(
    containerName: string,
    endpoint: EndpointHttpRest,
    probeType: ProbeType,
  ): ProbeFunction | undefined {
    const probe = endpoint.probes?.[probeType];
    if (probe === undefined) {
      return undefined;
    }

    const scheme = endpoint.protocol.startsWith('HTTPS') ? 'https' : 'http';
    const url = `${scheme}://${containerName}:${endpoint.port}${probe.path ?? ''}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(endpoint.authorization ? this.getHttpAuthorizationHeaders(endpoint.authorization) : {}),
    };
    const body = probe.body ? JSON.stringify(probe.body) : undefined;

    const validateBody = probe.match.body ? this.ajv.compile(probe.match.body) : () => true;
    const validateStatus = (status: number) => {
      if (Array.isArray(probe.match.status)) {
        return probe.match.status.includes(status);
      }
      return status === probe.match.status;
    };

    return async (): Promise<ProbeResponse> => {
      return fetch(url, {
        method: probe.method,
        headers: headers,
        body: body,
      })
        .then(async (response) => {
          const body = await response.json();
          return {
            ok: validateStatus(response.status) && validateBody(body),
            raw: {
              status: response.status,
              body: body,
            },
          };
        })
        .catch((error) => {
          debug('Error probing %s: %o', url, error);
          return { ok: false };
        });
    };
  }

  private createProbeFunctionHttpJsonRpc(
    containerName: string,
    endpoint: EndpointHttpJsonRpc,
    probeType: ProbeType,
  ): ProbeFunction | undefined {
    const probe = endpoint.probes?.[probeType];
    if (probe === undefined) {
      return undefined;
    }

    const scheme = endpoint.protocol.startsWith('HTTPS') ? 'https' : 'http';
    const url = `${scheme}://${containerName}:${endpoint.port}${endpoint.path ?? ''}`;
    const version = endpoint.protocol.endsWith('2.0') ? '2.0' : '1.0';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(endpoint.authorization ? this.getHttpAuthorizationHeaders(endpoint.authorization) : {}),
    };

    const validate = this.ajv.compile(probe.match.result);

    return async (): Promise<ProbeResponse> => {
      return fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          jsonrpc: version,
          method: probe.method,
          params: probe.params,
          id: randomInt(0, 999999999999),
        }),
      })
        .then(async (response) => {
          const body: any = await response.json();
          return {
            ok: validate(body.result),
            raw: {
              status: response.status,
              body: body,
            },
          };
        })
        .catch((error) => {
          debug('Error probing %s: %o', url, error);
          return { ok: false };
        });
    };
  }

  private getHttpAuthorizationHeaders(auth: EndpointHttpAuthorization): Record<string, string> {
    const type = auth.type;
    if (type === 'HttpBasic') {
      const username = this.resolve(auth.username);
      const password = this.resolve(auth.password);
      return {
        Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
      };
    } else if (type === 'HttpBearer') {
      const token = this.resolve(auth.token);
      return {
        Authorization: `Bearer ${token}`,
      };
    } else {
      throw new Error(`Unknown authorization type: ${type}`);
    }
  }

  private resolve(param: string | ParamReference): string {
    if (typeof param === 'string') {
      return param;
    }

    return this.params[param.$param] ?? '';
  }
}

// TODO(?): Probes (Liveness, Readiness, Startup) currently only allow a single probe per endpoint
//  We should allow multiple endpoints per container where some conditions can only be checked by through calling
//  multiple endpoints.
//  For example, a container with 3 conditions required for it to be liveness:
//  Container: /api/condition-1  <-|
//           : /api/condition-2  <-| Agent: /probes/liveness
//           : /api/condition-3  <-|
