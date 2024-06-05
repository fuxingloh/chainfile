import { z } from 'zod';

import { publicProcedure, router } from '../trpc';

export const agentRouter = router({
  GetChainfile: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/chainfile', tags: ['agent'] } })
    .input(z.void())
    .output(
      z.object({
        $schema: z.string(),
        caip2: z.string(),
        name: z.string(),
        env: z.any().optional(),
        containers: z.any(),
      }),
    )
    .query(async ({ ctx }) => {
      return ctx.chainfile;
    }),
});
