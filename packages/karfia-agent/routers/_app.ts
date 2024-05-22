import { createCallerFactory, router } from '../trpc';
import { agentRouter } from './agent';
import { probesRouter } from './probes';

export const appRouter = router({
  Probes: probesRouter,
  Agent: agentRouter,
});

export const createCaller = createCallerFactory(appRouter);
