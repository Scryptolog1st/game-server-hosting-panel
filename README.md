# GameServer Platform (Monorepo)

Initial scaffold for the Linux-only, self-hosted game server hosting platform.

## Packages
- `panel/` — API & admin panel (NestJS + Fastify runtime)
- `licensing-server/` — centralized licensing service (NestJS)
- `web/` — React + Vite web UI
- `agent/` — Node agent (Go), runs on customer server nodes

## Quickstart (dev)
```bash
# Node v20+, PNPM v9+ recommended
corepack enable
corepack prepare pnpm@latest --activate

pnpm install
pnpm -C panel dev
pnpm -C licensing-server dev
pnpm -C web dev

# Agent (Go 1.22+)
cd agent && go run ./cmd/agent
```

## CI
See `.github/workflows/ci.yml` for lint/build pipelines.
