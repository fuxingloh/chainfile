import Ajv from 'ajv';
import addFormats from 'ajv-formats';

import schema, { KarfiaDefinition } from './';

const ajv = new Ajv();
addFormats(ajv);

const validateDefinition = ajv.compile(schema);

/**
 * Validate a Karfia Definition against the json schema.
 */
export function validate(definition: any): asserts definition is KarfiaDefinition {
  const valid = validateDefinition(definition);
  if (!valid) {
    throw new Error(`Invalid Karfia Definition: ${ajv.errorsText(validateDefinition.errors)}`);
  }
}
