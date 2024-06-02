import Ajv from 'ajv';
import addFormats from 'ajv-formats';

import schema from './schema.json';
import { Chainfile } from './type';

const ajv = new Ajv();
addFormats(ajv);

export type * from './type';

const validateFunction = ajv.compile(schema);

/**
 * Validate a Chainfile against the json schema.
 */
export function validate(chainfile: any): asserts chainfile is Chainfile {
  const valid = validateFunction(chainfile);
  if (!valid) {
    throw new Error(`Invalid Chainfile: ${ajv.errorsText(validateFunction.errors)}`);
  }
}
