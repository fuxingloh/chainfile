import { initTRPC } from '@trpc/server';
import type { OpenApiMeta } from 'trpc-openapi';

import type { Context } from './routers/_context';

const t = initTRPC.meta<OpenApiMeta>().context<Context>().create({});

export const router = t.router;

export const mergeRouters = t.mergeRouters;

export const createCallerFactory = t.createCallerFactory;

export const publicProcedure = t.procedure;
