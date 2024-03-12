import console from 'node:console';
import process from 'node:process';

import { KarfiaDefinition } from 'karfia-definition';
import { validate } from 'karfia-definition/schema';

function getKarfiaDefinition(): KarfiaDefinition {
  const KARFIA_DEFINITION_JSON = process.env.KARFIA_DEFINITION_JSON;
  if (KARFIA_DEFINITION_JSON === undefined) {
    throw new Error('KARFIA_DEFINITION_JSON is not defined, cannot start karfia-agent.');
  }

  const definition = JSON.parse(KARFIA_DEFINITION_JSON);
  console.log(`Karfia Definition`);
  console.log(JSON.stringify(definition, null, 2));

  validate(definition);
  return definition;
}

function getKarfiaDeploymentId(): string {
  const deploymentId = process.env.KARFIA_DEPLOYMENT_ID;
  if (deploymentId === undefined || !deploymentId.match(/^[a-f0-9]{16}$/)) {
    throw new Error('KARFIA_DEPLOYMENT_ID is not defined (must match ^[a-f0-9]{16}$), cannot start karfia-agent.');
  }
  return deploymentId;
}

const definition = getKarfiaDefinition();
const deploymentId = getKarfiaDeploymentId();

export const createContext = async () => {
  return {
    definition: definition,
    deploymentId: deploymentId,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
