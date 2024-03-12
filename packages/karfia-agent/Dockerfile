FROM node:20-alpine as base
RUN apk add --no-cache libc6-compat python3 make g++ && \
    apk update
WORKDIR /app

RUN corepack enable pnpm

ENV PNPM_HOME="/root/.local/share/pnpm/global" \
    PATH="$PATH:/root/.local/share/pnpm/global"
RUN pnpm config set store-dir /root/.local/share/pnpm/global/store/v3

# renovate: datasource=npm depName=turbo
ENV TURBO_VERSION=1.12.5
RUN pnpm add -g turbo@${TURBO_VERSION}

# Isolate workspace by pruning non-related services.
FROM base AS pruner

COPY . .

RUN pnpm turbo prune --scope=karfia-agent --docker

# Build project with isolated workspace
FROM base AS builder

COPY .gitignore pnpm-workspace.yaml ./

COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# Mount cache to copy from content-addressable store; ignore cross-device link errors due to different mount points.
RUN --mount=type=cache,target=/root/.local/share/pnpm/global/store/v3\
  pnpm install --frozen-lockfile\
  | grep -v "cross-device link not permitted\|Falling back to copying packages from store"

COPY --from=pruner /app/out/full/ .

# To relink dependencies with ./bin links
RUN pnpm install --frozen-lockfile --offline

ARG PACKAGE_PATH
RUN pnpm turbo run build --filter=karfia-agent

# Run agent
FROM node:20-alpine AS runner
RUN addgroup --system --gid 1001 karfia-agent && \
    adduser --system --uid 1001 karfia-agent
USER karfia-agent

EXPOSE 1194
WORKDIR /app/packages/karfia-agent

COPY --from=builder --chown=karfia-agent:karfia-agent /app /app
CMD node "server.js"
