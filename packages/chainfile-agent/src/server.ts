import http from 'node:http';

import { createOpenApiHttpHandler } from 'trpc-openapi';

import { appRouter } from './routers/_app';
import { createContext } from './routers/_context';

const server = http.createServer(
  createOpenApiHttpHandler({
    router: appRouter,
    createContext: createContext,
  }),
);

/** The sum of the ASCII values for the string "@chainfile/agent" is 1569. */
server.listen(1569);
