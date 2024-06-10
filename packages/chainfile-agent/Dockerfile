FROM node:20-alpine as base
WORKDIR /app
RUN corepack enable pnpm

ENV PNPM_HOME="/pnpm" \
    PATH="/pnpm:$PATH"

COPY package.json package.json
RUN pnpm -v

ENV COREPACK_ENABLE_NETWORK=0 \
    TURBO_TELEMETRY_DISABLED=1

RUN pnpm config set store-dir /root/.local/share/pnpm/global/store/v3 \
    pnpm config set update-notifier false

# Isolate workspace by pruning non-related services.
FROM base AS pruner

# renovate: datasource=npm depName=turbo
ENV TURBO_VERSION=2.0.3
RUN pnpm add -g turbo@${TURBO_VERSION}

COPY . .

RUN pnpm turbo prune --scope=@chainfile/agent --docker

# Build project with isolated workspace
FROM base AS builder

COPY .gitignore pnpm-workspace.yaml ./

COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .

RUN pnpm turbo run build --filter=@chainfile/agent

# Run agent
FROM node:20-alpine AS runner
WORKDIR /app/packages/chainfile-agent

RUN addgroup --system --gid 1001 chainfile && \
    adduser --system --uid 1001 chainfile
USER chainfile

EXPOSE 1569
COPY --from=builder --chown=chainfile:chainfile /app /app
CMD node "dist/server.js"
