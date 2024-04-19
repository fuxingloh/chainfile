import { expect, it } from '@jest/globals';
import { KarfiaDefinition } from 'karfia-definition';

import { KarfiaTestcontainers } from './index';

it('should start two exact karfia testcontainers instance', async () => {
  const definition: KarfiaDefinition = {
    id: 'eip155:1337/ganache:7.9.1',
    caip2: 'eip155:1337',
    name: 'Ganache',
    containers: {
      ganache: {
        image: 'docker.io/trufflesuite/ganache@sha256:c62c58290c28e24b427f74c6f597ff696257bd2d8e8d517ce4cf46b29b304a3f',
        source: 'https://github.com/trufflesuite/ganache',
        resources: {
          cpu: 0.25,
          memory: 256,
        },
        endpoints: {},
      },
    },
  };

  const one = await KarfiaTestcontainers.start(definition);
  const two = await KarfiaTestcontainers.start(definition);
  expect(one.getDeploymentId()).not.toBe(two.getDeploymentId());
});
