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

/** The sum of the ASCII values for the string "karfia-agent" is 1194. */
server.listen(1194);
