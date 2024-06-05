FROM node:20-alpine as base
RUN apk add --no-cache libc6-compat python3 make g++ && \
    apk update
WORKDIR /app

RUN corepack enable pnpm

ENV PNPM_HOME="/root/.local/share/pnpm/global" \
    PATH="$PATH:/root/.local/share/pnpm/global"

COPY package.json package.json
RUN pnpm -v
ENV COREPACK_ENABLE_NETWORK=0

RUN pnpm config set store-dir /root/.local/share/pnpm/global/store/v3

# Isolate workspace by pruning non-related services.
FROM base AS pruner

# renovate: datasource=npm depName=turbo
ENV TURBO_VERSION=2.0.1
RUN pnpm add -g turbo@${TURBO_VERSION}

COPY . .

RUN pnpm turbo prune --scope=@chainfile/agent --docker

# Build project with isolated workspace
FROM base AS builder

COPY .gitignore pnpm-workspace.yaml ./

COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# Mount cache to copy from content-addressable store
RUN --mount=type=cache,target=/root/.local/share/pnpm/global/store/v3\
  pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .

# To relink dependencies with ./bin links
RUN pnpm install --frozen-lockfile --offline

RUN pnpm turbo run build --filter=@chainfile/agent

# Run agent
FROM node:20-alpine AS runner
RUN addgroup --system --gid 1001 chainfile && \
    adduser --system --uid 1001 chainfile
USER chainfile

EXPOSE 1569
WORKDIR /app/packages/chainfile-agent

COPY --from=builder --chown=chainfile:chainfile /app /app
CMD node "dist/server.js"
