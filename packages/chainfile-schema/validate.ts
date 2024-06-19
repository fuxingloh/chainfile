import Ajv from 'ajv';
import addFormats from 'ajv-formats';

import schema, { Chainfile, Container } from './schema';

const ajv = new Ajv();
addFormats(ajv);

const validateFunction = ajv.compile(schema);

/**
 * Validate against the schema.json file with additional checks:
 * - check that all ports in all containers are unique.
 * - check that all volumes are mountable.
 */
export function validate(chainfile: object): void {
  if (!validateFunction(chainfile)) {
    throw new Error(ajv.errorsText(validateFunction.errors));
  }

  const cf = chainfile as Chainfile;
  // Check that all ports in all containers are unique, so they can be deployed onto a single host.
  const ports = Object.values(cf.containers)
    .flatMap((container: Container) => Object.values(container.endpoints ?? {}))
    .map((endpoint) => endpoint.port);
  if (new Set(ports).size !== ports.length) {
    throw new Error('All ports in all containers must be unique.');
  }

  // Check that all volumes can be mounted
  const volumes = cf.volumes ?? {};
  for (const container of Object.values(cf.containers)) {
    for (const mount of container.mounts ?? []) {
      if (!volumes[mount.volume]) {
        throw new Error(`Volume ${mount.volume} is not defined.`);
      }
    }
  }
}
