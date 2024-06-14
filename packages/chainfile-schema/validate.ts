import Ajv from 'ajv';
import addFormats from 'ajv-formats';

import schema, { Chainfile, Container } from './schema';

const ajv = new Ajv();
addFormats(ajv);

const validateFunction = ajv.compile(schema);

export function validate(chainfile: object): void {
  if (!validateFunction(chainfile)) {
    throw new Error(ajv.errorsText(validateFunction.errors));
  }

  // Check that all ports in all containers are unique, so they can be deployed onto a single host.
  const ports = Object.values((chainfile as Chainfile).containers)
    .flatMap((container: Container) => Object.values(container.endpoints ?? {}))
    .map((endpoint) => endpoint.port);
  if (new Set(ports).size !== ports.length) {
    throw new Error('All ports in all containers must be unique.');
  }
}
