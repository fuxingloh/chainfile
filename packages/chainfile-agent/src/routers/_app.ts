import { createCallerFactory, mergeRouters } from '../trpc';
import { agentRouter } from './agent';
import { probesRouter } from './probes';

export const appRouter = mergeRouters(probesRouter, agentRouter);

export const createCaller = createCallerFactory(appRouter);
