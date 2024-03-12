import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { KarfiaAgentContainer, KarfiaTestContainer, KarfiaTestcontainers } from 'karfia-testcontainers';

import definition from './hardhat.json';

describe('testcontainers', () => {
  let testcontainers: KarfiaTestcontainers;

  beforeAll(async () => {
    testcontainers = await KarfiaTestcontainers.start(definition);
  });

  afterAll(async () => {
    await testcontainers.stop();
  });

  describe('hardhat', () => {
    let hardhat: KarfiaTestContainer;

    beforeAll(() => {
      hardhat = testcontainers.getContainer('hardhat');
    });

    it('should rpc(eth_blockNumber)', async () => {
      const response = await hardhat.rpc({
        method: 'eth_blockNumber',
      });

      expect(response.status).toStrictEqual(200);

      expect(await response.json()).toMatchObject({
        result: '0x0',
      });
    });
  });

  describe('karfia-agent', () => {
    let agent: KarfiaAgentContainer;

    beforeAll(() => {
      agent = testcontainers.getKarfiaAgent();
    });

    it('should get karfia-agent/deployment', async () => {
      const result = await agent.getDeployment();
      expect(result).toMatchObject({
        deploymentId: testcontainers.getDeploymentId(),
        definitionId: definition.id,
        caip2: definition.caip2,
        name: definition.name,
      });
    });

    it('should get karfia-agent/definition', async () => {
      const result = await agent.getDefinition();
      const expected = {
        ...definition,
        $schema: undefined,
      };
      delete expected.$schema;
      expect(result).toMatchObject(expected);
    });

    it('should get karfia-agent/probes/startup', async () => {
      const response = await agent.probe('startup');
      expect(response.status).toStrictEqual(200);
      expect(await response.json()).toMatchObject({
        ok: true,
      });
    });

    it('should get karfia-agent/probes/liveness', async () => {
      const response = await agent.probe('liveness');
      expect(response.status).toStrictEqual(200);
      expect(await response.json()).toMatchObject({
        ok: true,
      });
    });

    it('should get karfia-agent/probes/readiness', async () => {
      const response = await agent.probe('readiness');
      expect(response.status).toStrictEqual(200);
      expect(await response.json()).toMatchObject({
        containers: {
          hardhat: {
            ok: true,
          },
        },
        ok: true,
      });
    });
  });
});
