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

function getParams(): Record<string, string> {
  const params = process.env.CHAINFILE_PARAMS;
  if (params !== undefined) {
    return JSON.parse(params);
  }

  throw new Error('CHAINFILE_PARAMS is not defined, cannot start @chainfile/agent.');
}

const chainfile = getChainfile();
const params = getParams();

export const createContext = async () => {
  return {
    chainfile: chainfile,
    params: params,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
