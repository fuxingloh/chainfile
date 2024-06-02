import console from 'node:console';
import process from 'node:process';

import { Chainfile, validate } from 'chainfile/schema';

function getChainfile(): Chainfile {
  const CHAINFILE_JSON = process.env.CHAINFILE_JSON;
  if (CHAINFILE_JSON === undefined) {
    throw new Error('CHAINFILE_JSON is not defined, cannot start chainfile-agent.');
  }

  const chainfile = JSON.parse(CHAINFILE_JSON);
  console.log(`Chainfile:`);
  console.log(JSON.stringify(chainfile, null, 2));

  validate(chainfile);
  return chainfile;
}

function getChainfileDeploymentId(): string {
  const deploymentId = process.env.CHAINFILE_DEPLOYMENT_ID;
  if (deploymentId === undefined || !deploymentId.match(/^[a-f0-9]{16}$/)) {
    throw new Error(
      'CHAINFILE_DEPLOYMENT_ID is not defined (must match ^[a-f0-9]{16}$), cannot start chainfile-agent.',
    );
  }
  return deploymentId;
}

const chainfile = getChainfile();
const deploymentId = getChainfileDeploymentId();

export const createContext = async () => {
  return {
    chainfile: chainfile,
    deploymentId: deploymentId,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
