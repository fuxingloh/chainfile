import console from 'node:console';
import process from 'node:process';

import { ChainfileDefinition } from 'chainfile';
import { validate } from 'chainfile/schema';

function getChainfileDefinition(): ChainfileDefinition {
  const CHAINFILE_DEFINITION_JSON = process.env.CHAINFILE_DEFINITION_JSON;
  if (CHAINFILE_DEFINITION_JSON === undefined) {
    throw new Error('CHAINFILE_DEFINITION_JSON is not defined, cannot start chainfile-agent.');
  }

  const definition = JSON.parse(CHAINFILE_DEFINITION_JSON);
  console.log(`Chainfile Definition`);
  console.log(JSON.stringify(definition, null, 2));

  validate(definition);
  return definition;
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

const definition = getChainfileDefinition();
const deploymentId = getChainfileDeploymentId();

export const createContext = async () => {
  return {
    definition: definition,
    deploymentId: deploymentId,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
