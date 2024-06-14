import Ajv from 'ajv';
import addFormats from 'ajv-formats';

import schema from './schema.json';

const ajv = new Ajv();
addFormats(ajv);

const validateFunction = ajv.compile(schema);

export function validate(chainfile: object): void {
  // TODO(fuxingloh): Validation, check ports uniqueness.

  if (!validateFunction(chainfile)) {
    throw new Error(ajv.errorsText(validateFunction.errors));
  }
}
