import { Buffer } from 'node:buffer';
import { randomInt } from 'node:crypto';

import {
  Chainfile,
  Endpoint,
  EndpointHttpAuthorization,
  EndpointHttpJsonRpc,
  EndpointHttpRest,
  EnvReference,
} from '@chainfile/schema';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { z } from 'zod';

import { publicProcedure, router } from '../trpc';

const probeProcedure = publicProcedure.input(z.void()).output(
  z.object({
    ok: z.boolean(),
    containers: z.record(z.object({ ok: z.boolean(), raw: z.any() })),
  }),
);

export const probesRouter = router({
  ProbeStartup: probeProcedure
    .meta({ openapi: { method: 'GET', path: '/probes/startup', tags: ['probes'] } })
    .query(async ({ ctx }) => {
      return query(ctx.chainfile, ProbeType.startup);
    }),
  ProbeLiveness: probeProcedure
    .meta({ openapi: { method: 'GET', path: '/probes/liveness', tags: ['probes'] } })
    .query(async ({ ctx }) => {
      return query(ctx.chainfile, ProbeType.liveness);
    }),
  ProbeReadiness: probeProcedure
    .meta({ openapi: { method: 'GET', path: '/probes/readiness', tags: ['probes'] } })
    .query(async ({ ctx }) => {
      return query(ctx.chainfile, ProbeType.readiness);
    }),
});

async function query(chainfile: Chainfile, probeType: ProbeType) {
  const probeFunctions = Object.entries(chainfile.containers).flatMap(
    ([name, container]): [string, ProbeFunction][] => {
      return Object.values(container.endpoints)
        .map((endpoint): [string, ProbeFunction] | undefined => {
          const func = createProbeFunction(name, endpoint, probeType);
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
    containers: containers.reduce(
      (acc, { name, ok, raw }) => {
        acc[name] = {
          ok: ok,
          raw: raw,
        };
        return acc;
      },
      {} as Record<string, { ok: boolean; raw?: any }>,
    ),
  };
}

const ajv = new Ajv();
addFormats(ajv);

enum ProbeType {
  startup = 'startup',
  liveness = 'liveness',
  readiness = 'readiness',
}

type ProbeFunction = () => Promise<{
  ok: boolean;
  raw?: any;
}>;

function createProbeFunction(
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
      return createProbeFunctionHttpJsonRpc(containerName, endpoint as EndpointHttpJsonRpc, probeType);
    case 'HTTP REST':
    case 'HTTPS REST':
      return createProbeFunctionHttp(containerName, endpoint as EndpointHttpRest, probeType);
    default:
      throw new Error(`Unknown protocol: ${protocol}`);
  }
}

function createProbeFunctionHttp(
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
    ...(endpoint.authorization ? getHttpAuthorizationHeaders(endpoint.authorization) : {}),
  };
  const body = probe.body ? JSON.stringify(probe.body) : undefined;

  const validateBody = probe.match.body ? ajv.compile(probe.match.body) : () => true;
  const validateStatus = (status: number) => {
    if (Array.isArray(probe.match.status)) {
      return probe.match.status.includes(status);
    }
    return status === probe.match.status;
  };

  return async (): Promise<{ ok: boolean; raw?: any }> => {
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
      .catch(() => ({ ok: false }));
  };
}

function createProbeFunctionHttpJsonRpc(
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
    ...(endpoint.authorization ? getHttpAuthorizationHeaders(endpoint.authorization) : {}),
  };

  const validate = ajv.compile(probe.match.result);

  return async (): Promise<{ ok: boolean; raw?: any }> => {
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
      .catch(() => ({ ok: false }));
  };
}

function getHttpAuthorizationHeaders(auth: EndpointHttpAuthorization): Record<string, string> {
  const type = auth.type;
  if (type === 'HttpBasic') {
    const username = resolveValue(auth.username);
    const password = resolveValue(auth.password);
    return {
      Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
    };
  } else if (type === 'HttpBearer') {
    const token = resolveValue(auth.token);
    return {
      Authorization: `Bearer ${token}`,
    };
  } else {
    throw new Error(`Unknown authorization type: ${type}`);
  }
}

/**
 * Resolve value that can be a reference to an environment variable.
 * Look for `${KEY}` injected through `CHAINFILE_ENVIRONMENT_KEY`.
 *
 * If the value is not a reference, it is returned as is.
 */
function resolveValue(value: string | EnvReference): string {
  if (typeof value === 'string') {
    return value;
  }

  return process.env[`CHAINFILE_ENVIRONMENT_${value.key}`] ?? '';
}
