# Stage 1: Builder (compila Mediasoup C++ worker y TypeScript)
FROM node:22-trixie-slim AS builder

WORKDIR /app

ENV PIP_BREAK_SYSTEM_PACKAGES=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-pip make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json swagger.config.ts ./
COPY src ./src

RUN npm run build \
    && npm prune --omit=dev

# Stage 2: Runtime mínimo sin compiladores, devDependencies ni gestores de paquetes globales
FROM node:22-trixie-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production

# Elimina npm/npx/corepack/yarn globales del runtime (CMD ejecuta directamente node)
RUN rm -rf /usr/local/lib/node_modules/npm \
           /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm \
           /usr/local/bin/npx \
           /usr/local/bin/corepack \
           /opt/yarn* \
           /usr/local/bin/yarn \
           /usr/local/bin/yarnpkg

COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "const port = process.env.PORT || 3000; fetch('http://127.0.0.1:' + port + '/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/src/index.js"]
