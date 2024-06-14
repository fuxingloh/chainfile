import console from 'node:console';
import process from 'node:process';

import { Chainfile, validate } from '@chainfile/schema';

function getChainfile(): Chainfile {
  const CHAINFILE_JSON = process.env.CHAINFILE_JSON;
  if (CHAINFILE_JSON === undefined) {
    throw new Error('CHAINFILE_JSON is not defined, cannot start @chainfile/agent.');
  }

  const chainfile = JSON.parse(CHAINFILE_JSON);
  console.log(`Chainfile:`);
  console.log(JSON.stringify(chainfile, null, 2));

  validate(chainfile);
  return chainfile;
}

function getValues(): Record<string, string> {
  const values = process.env.CHAINFILE_VALUES;
  if (values !== undefined) {
    return JSON.parse(values);
  }

  throw new Error('CHAINFILE_VALUES is not defined, cannot start @chainfile/agent.');
}

const chainfile = getChainfile();
const values = getValues();

export const createContext = async () => {
  return {
    chainfile: chainfile,
    values: values,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
