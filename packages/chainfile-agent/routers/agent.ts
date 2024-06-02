import { z } from 'zod';

import { publicProcedure, router } from '../trpc';

export const agentRouter = router({
  GetChainfile: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/chainfile', tags: ['agent'] } })
    .input(z.void())
    .output(
      z.object({
        $schema: z.string().optional(),
        id: z.string(),
        caip2: z.string(),
        name: z.string(),
        env: z.any().optional(),
        containers: z.any(),
      }),
    )
    .query(async ({ ctx }) => {
      return ctx.chainfile;
    }),
  GetDeployment: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/deployment', tags: ['agent'] } })
    .input(z.void())
    .output(
      z.object({
        deploymentId: z.string(),
        chainfileId: z.string(),
        caip2: z.string(),
        name: z.string(),
      }),
    )
    .query(async ({ ctx }) => {
      return {
        deploymentId: ctx.deploymentId,
        chainfileId: ctx.chainfile.id,
        caip2: ctx.chainfile.caip2,
        name: ctx.chainfile.name,
      };
    }),
});
