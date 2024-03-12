import { router } from '../trpc';
import { agentRouter } from './agent';
import { probesRouter } from './probes';

export const appRouter = router({
  probes: probesRouter,
  agent: agentRouter,
});
