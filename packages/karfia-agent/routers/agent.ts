import { z } from 'zod';

import { publicProcedure, router } from '../trpc';

export const agentRouter = router({
  getDefinition: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/definition', tags: ['agent'] } })
    .input(z.void())
    .output(
      z.object({
        $schema: z.string().optional(),
        id: z.string(),
        caip2: z.string(),
        name: z.string(),
        environment: z.any().optional(),
        containers: z.any(),
      }),
    )
    .query(async ({ ctx }) => {
      return ctx.definition;
    }),
  getDeployment: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/deployment', tags: ['agent'] } })
    .input(z.void())
    .output(
      z.object({
        deploymentId: z.string(),
        definitionId: z.string(),
        caip2: z.string(),
        name: z.string(),
      }),
    )
    .query(async ({ ctx }) => {
      return {
        deploymentId: ctx.deploymentId,
        definitionId: ctx.definition.id,
        caip2: ctx.definition.caip2,
        name: ctx.definition.name,
      };
    }),
});
