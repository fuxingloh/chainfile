import Ajv from 'ajv';
import addFormats from 'ajv-formats';

import schema, { ChainfileDefinition } from './';

const ajv = new Ajv();
addFormats(ajv);

const validateDefinition = ajv.compile(schema);

/**
 * Validate a Chainfile Definition against the json schema.
 */
export function validate(definition: any): asserts definition is ChainfileDefinition {
  const valid = validateDefinition(definition);
  if (!valid) {
    throw new Error(`Invalid Chainfile Definition: ${ajv.errorsText(validateDefinition.errors)}`);
  }
}
