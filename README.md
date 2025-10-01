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




# Project Roadmap & Execution Plan

> **Goal**: Build a secure, modern, Linux‑only, self‑hosted game‑server
> hosting platform with a central licensing server. Customers deploy the
> panel in their own infrastructure (single node or multi‑node),
> purchase a license, and manage SteamCMD‑based game servers (with
> player management, mod/workshop integration, and role‑based access).
> Platform includes first‑party billing (Stripe/PayPal), node agents,
> templates for games, and an extensible plugin SDK.

------------------------------------------------------------------------

## 1) Product Scope

### 1.1 Core Features (MVP)

-   **Self‑hosted Admin Panel** (web UI + API) running on Linux
    (Ubuntu/Debian/Alpine) only.
-   **License Enforcement** via your centralized Licensing Server
    (cloud‑hosted by you).
-   **Server Nodes**: lightweight agent installed on each host;
    communicates with the Panel.
-   **Game Servers via SteamCMD**: install, update, start/stop/restart,
    validate, verify files.
-   **Game Templates**: per‑game defaults (ports, launch args, env,
    files, mods, RCON/query).
-   **Player Management**: live player list, kick/ban/unban, make admin
    (where supported).
-   **Mods/Workshop**: search, subscribe, install, update,
    enable/disable per server.
-   **RBAC**: Organizations, Projects, Users, Roles, and granular
    Permissions.
-   **Billing**: native **Stripe** (MVP) and optional **PayPal**
    integration (post‑MVP).
-   **Audit Logs & Actions**: every admin/user action is recorded
    (immutable log).
-   **Backups & Snapshots**: on‑node local backups; optional off‑site/S3
    toggle.
-   **Health & Metrics**: node heartbeats, server health, resource
    usage, alerts.

### 1.2 Post‑MVP Enhancements

-   **Multi‑tenancy**: one panel serving multiple organizations safely
    isolated.
-   **Marketplace/Plugin SDK**: community game templates, mod handlers,
    publishers.
-   **Scheduled Tasks**: restarts, backups, updates, mod sync, map
    rotations.
-   **Per‑game Admin UX**: rich server consoles, map/mission editors
    (where feasible).
-   **SSO** (OIDC/SAML), **WebAuthn** passkeys, SCIM user provisioning.
-   **High‑availability** controller (active/active) and multi‑region
    node mesh.
-   **Usage‑based billing** (for your license tiers) and automated seat
    tracking.

------------------------------------------------------------------------

## 2) Architecture Overview

    +-------------------------------+                 +------------------------------+
    |  Customer's Self-Hosted Panel |   Mutual TLS    | Central Licensing Server     |
    |  (API + Web UI + DB + MQ)     |<===============>| (API + DB + Webhooks)        |
    +-------------------------------+                 +------------------------------+
               |   ^                                         ^
               |   | gRPC/HTTPS                              | Stripe/PayPal Webhooks
               v   | (mTLS + JWT)                            |
    +------------------------------+                        |
    | Server Node Agents (N>=1)   |<------------------------+
    |  - SteamCMD wrapper         |     License Provisioning & Entitlements
    |  - Game lifecycle           |
    |  - RCON/Query bridge        |
    |  - FS/Backup/Mods           |
    +------------------------------+

**Key decisions** - Linux‑only target simplifies packaging, security
posture, and SteamCMD support. - **Stateless API** layer; state in DB +
object storage; MQ for orchestration. - **Node Agent** is sandboxed
(rootless where possible) and uses containers per game. - **Templates**
drive game behaviors; no hard‑coding per‑game logic in core. -
**Zero‑trust** node communications: mutual TLS + short‑lived JWTs.

------------------------------------------------------------------------

## 3) Suggested Tech Stack (modern, non‑deprecated)

-   **Backend (Panel API)**: TypeScript + **NestJS** (or Go w/
    Fiber/Chi) + Zod for schema.
-   **Frontend (Web UI)**: React + Vite + TypeScript + Tailwind +
    shadcn/ui.
-   **Node Agent**: Go (static binary, low footprint) or Rust; gRPC for
    control channel.
-   **DB**: PostgreSQL 15+; Prisma (TS) or SQLC (Go). Migrations via
    Prisma/Atlas.
-   **Message Queue**: NATS or RabbitMQ. (NATS recommended for light
    orchestration.)
-   **Object Storage**: S3‑compatible (MinIO) for
    backups/templates/artifacts.
-   **Containers**: Docker/Podman; each game server runs in its own
    container.
-   **Auth**: Ory Kratos/Hydra or custom JWT/OIDC. 2FA (TOTP) + optional
    WebAuthn.
-   **Licensing crypto**: Ed25519 signatures on entitlements; JOSE/JWT
    for tokens.
-   **Observability**: OpenTelemetry + Prometheus + Grafana + Loki.
-   **CI/CD**: GitHub Actions; SBOM (Syft), container signing (Cosign),
    Trivy scans.

> If you prefer Go end‑to‑end: Panel API in Go (Chi), templating in Cue,
> and the agent in Go.

------------------------------------------------------------------------

## 4) Licensing Server Design

### 4.1 Concepts

-   **Product** → **Plan/Tier** → **License** (org‑scoped) →
    **Entitlements** (limits).
-   **Entitlement Claims** (JWT): max_nodes, max_servers, support_level,
    expiry, features\[\].
-   **Device Binding**: optional hardware fingerprint per panel instance
    (host key + MAC hash).

### 4.2 Flows

-   **Purchase** (Stripe Checkout) → webhook to Licensing Server →
    creates License → sends activation email/token.
-   **Activation**: Panel posts **activation_code** + org info →
    Licensing returns signed **license.jwt** (short‑lived) + **refresh
    token** (long‑lived, rotatable).
-   **Heartbeat**: Panel → Licensing every N hours; on failure: **grace
    period** (e.g., 7 days) then degraded mode.
-   **Offline Mode**: customer can pre‑download time‑boxed signed bundle
    (e.g., 30 days) for air‑gapped sites.
-   **Revocation**: immediate via CRL endpoint; panels check CRL on each
    heartbeat.

### 4.3 Security

-   mTLS between Panel and Licensing; pinned CA.
-   Sign all entitlements with Ed25519; rotate keys via KMS (HashiCorp
    Vault/Cloud KMS).
-   Audit every issuance/refresh/revocation.

------------------------------------------------------------------------

## 5) Node Agent Design

### 5.1 Responsibilities

-   Register with Panel (join token), establish mTLS, fetch
    entitlements.
-   Manage **SteamCMD** installs/updates per game server container
    layer.
-   Manage lifecycle: create/start/stop/restart/validate/verify, log and
    metrics shipping.
-   Execute commands via RCON/Query bridges; stream console.
-   Mods/workshop: download, cache, enable/disable per server template.
-   FS ops: backups, restores, diff/verify, quota enforcement.
-   Health: heartbeats, resource stats, crash detection, auto‑restart
    policies.

### 5.2 Safety & Isolation

-   Rootless containers where possible; cgroups/CPU/mem quotas;
    seccomp/AppArmor.
-   Per‑server **UID/GID** mapping; read‑only FS layers; writable
    volumes for saves.
-   Signed agent releases; auto‑update channel with staged rollouts.

### 5.3 Protocol

-   **gRPC** control plane with mutual TLS.
-   Event bus (NATS) for async jobs (installs, backups, workshop sync).
-   Streaming logs/metrics via gRPC bidi streams.

------------------------------------------------------------------------

## 6) Game Support via Templates

### 6.1 Template Model

-   `gameId`, `displayName`, `steamAppId`, `ports[]`, `env[]`, `cmd[]`,
    `rcon`, `query`, `workshop` config, `files` includes/excludes,
    `preStart/postStop` hooks.
-   Versioned JSON (or CUE) with validation; stored in Git repo + signed
    releases.

### 6.2 Workshop/Mods

-   Steam Workshop: API key + per‑server collection IDs or item IDs.
-   Mods cache on node; enable/disable links per instance; auto update
    schedule.

### 6.3 RCON/Query Abstraction

-   Pluggable adaptors: Source RCON, Battleye, Query protocols.
-   Standard API in panel: list players, kick/ban/unban, set admin/op,
    map/mission.

------------------------------------------------------------------------

## 7) RBAC & Multi‑Tenancy

-   **Organization** → **Project** → **Server** hierarchy.
-   Roles: **Owner, Admin, Operator, BillingAdmin, Support, ReadOnly**
    (custom roles allowed).
-   Permissions: fine‑grained (servers.manage, mods.manage,
    billing.view, nodes.register, etc.).
-   SSO integrations (OIDC/SAML) optional; SCIM for enterprise user sync
    (post‑MVP).

------------------------------------------------------------------------

## 8) Billing Integration (Customer's Panel)

-   Stripe first (Subscriptions + Seats + Webhooks for
    invoice.paid/failed).
-   PayPal later via their Subscriptions API.
-   In‑product entitlements change on webhook → Panel sync → Node quotas
    enforced.
-   Tax/VAT via Stripe Tax; invoices/receipts in UI; dunning emails.

> Your **licensing server** can also sell *your* software license.
> Separate from panel's own customer billing if they resell hosting.

------------------------------------------------------------------------

## 9) Data Model (High‑Level)

**Core** - `organizations(id, name, owner_user_id, created_at)` -
`users(id, email, passhash, twofa_enabled, created_at)` -
`memberships(org_id, user_id, role)` -
`api_keys(id, org_id, user_id, scopes, last_used_at)`

**Infrastructure** -
`nodes(id, org_id, hostname, os, arch, version, status, last_seen_at)` -
`servers(id, org_id, node_id, game_id, name, status, ports, rcon, config_json)` -
`server_metrics(server_id, ts, cpu, mem, net_in, net_out, players)`
(TSDB or Prometheus)

**Games/Templates/Mods** -
`games(id, name, steam_app_id, default_template_ref)` -
`templates(id, game_id, version, manifest_json, signature)` -
`server_mods(server_id, workshop_id, enabled, last_sync_at)`

**Billing/Licensing** -
`licenses(id, org_id, plan, entitlements_json, status, expires_at)` -
`payments(id, org_id, provider, amount, currency, status, invoice_url)`

**Audit & Ops** -
`audit_logs(id, org_id, actor_user_id, action, target, diff, ip, ts)` -
`jobs(id, org_id, type, payload, status, started_at, finished_at, error)`

------------------------------------------------------------------------

## 10) External & Internal APIs (Examples)

**Panel REST/gRPC** - `POST /v1/auth/login` (2FA),
`POST /v1/auth/impersonate` (Owner only) - `GET /v1/orgs/:id/servers`,
`POST /v1/orgs/:id/servers` (create from template) -
`POST /v1/servers/:id/actions/{start|stop|restart|backup|restore}` -
`GET /v1/servers/:id/players`,
`POST /v1/servers/:id/players/:pid/{kick|ban|op}` -
`POST /v1/servers/:id/mods/sync`, `PATCH /v1/servers/:id/mods/:mid` -
`POST /v1/nodes/register`, `GET /v1/nodes`, `DELETE /v1/nodes/:id` -
`GET /v1/audit`, `GET /v1/metrics` (scoped)

**Licensing Server** - `POST /v1/licenses/activate` → returns signed JWT
entitlement - `POST /v1/licenses/refresh` → rotate tokens -
`POST /v1/licenses/revoke` (admin) - `GET /v1/licenses/crl` (revocation
list)

------------------------------------------------------------------------

## 11) Security Model & Hardening Checklist

-   **Transport**: mTLS everywhere (Panel↔Licensing, Panel↔Agent). TLS
    1.3, strong ciphers.
-   **Identity**: per‑node short‑lived certs from private CA;
    SPIFFE/SPIRE optional.
-   **AuthN/Z**: JWT access tokens (short‑lived) + refresh rotation;
    RBAC checks server‑side.
-   **Secrets**: Vault or SOPS; never store raw API keys. KMS‑backed key
    rotation.
-   **Filesystem**: rootless containers, read‑only layers, limited
    capabilities.
-   **Network**: per‑server network policies; egress limits; rate‑limit
    RCON endpoints.
-   **Supply Chain**: SBOMs, signed images (Cosign), vulnerability scans
    (Trivy), Dependabot.
-   **Audit**: immutable logs; tamper‑evident hashing; export to SIEM.
-   **Backups**: encrypted at rest; tested restores; retention policies;
    air‑gapped option.
-   **Privacy**: minimal PII collection; data processing addendum;
    GDPR/CCPA controls.
-   **Abuse**: anti‑DDoS guidance; fail‑2‑ban for admin endpoints;
    CAPTCHA on auth.

------------------------------------------------------------------------

## 12) DevOps & Deployment

-   **Packaging**: Helm charts + Docker Compose for simple installs.
-   **Environments**: dev → staging → prod; seed data fixtures;
    ephemeral preview envs.
-   **CI/CD**: lint, unit tests, integration tests (kind), e2e
    (Playwright), security scans.
-   **Migrations**: zero‑downtime schema migrations; feature flags.
-   **Observability**: OTel traces; dashboards for
    node/servers/billing/licensing health.

------------------------------------------------------------------------

## 13) UX Flows (MVP)

1)  **First‑Run Setup**: install panel → upload license or paste
    activation code → connect DB → create org → create first node
    join‑token → run `curl | sh` to install agent.
2)  **Add Game Server**: choose template (CS2, Valheim, Ark, SE, etc.) →
    set name/ports → mods → create.
3)  **Live Management**: view console/logs/metrics → start/stop/restart
    → players tab (kick/ban/admin) → mod sync.
4)  **Billing**: connect Stripe → create plans → customers subscribe →
    entitlements update.
5)  **Backups**: schedule daily local backup; optional remote target;
    restore flow.

------------------------------------------------------------------------

## 14) Milestones & Timeline (Example \~12 Weeks)

**W1‑2: Foundations** - Repos, CI/CD, threat model, architecture docs. -
Licensing server scaffold (activate/refresh/revoke) with signed JWT
entitlements. - Panel auth (users/orgs/RBAC), base UI shell.

**W3‑4: Node & Game Templates** - Agent bootstrap (mTLS, heartbeats),
container sandbox, SteamCMD module. - Template spec v1; implement 2
games end‑to‑end (e.g., CS2 + Valheim) as reference.

**W5‑6: Management & Mods** - RCON/query adapters; players list +
kick/ban. - Workshop integration; mod cache + per‑server
enable/disable. - Backups/snapshots local; restore flow.

**W7‑8: Billing & Audit** - Stripe subscriptions + webhooks;
entitlements enforcement in panel. - Audit log pipeline; alerting for
node/server down.

**W9‑10: Hardening & UX Polish** - Rate limits, 2FA, WebAuthn
(optional), secrets storage, signed images. - Dashboards (Grafana) for
nodes/servers; logs (Loki) in UI.

**W11: Docs & SDK** - Admin/Operator docs; template authoring guide;
plugin SDK scaffold.

**W12: Beta & Feedback** - Limited beta with 3‑5 orgs; bugfixes;
performance tuning.

------------------------------------------------------------------------

## 15) Testing Strategy

-   **Unit**: template validators, licensing signatures, RBAC guards.
-   **Integration**: agent↔panel control flows, SteamCMD installs, mod
    sync.
-   **E2E**: create server, start, join, kick/ban, backup/restore.
-   **Chaos**: kill agent mid‑install, network partitions, disk full,
    SteamCMD failures.
-   **Security**: authZ fuzzing, SSRF/command‑injection tests, container
    escape attempts.

------------------------------------------------------------------------

## 16) Risks & Mitigations

-   **Game‑specific quirks** → mitigate with versioned templates and
    per‑game adapters.
-   **Workshop rate limits** → backoff + caching; user‑provided API
    keys.
-   **Licensing outages** → grace periods + offline bundles; status
    page.
-   **Abusive workloads** → quotas, CPU/mem caps, network egress
    policies per server.
-   **Compliance** → Stripe Tax, PCI SAQ‑A; never store card data
    directly.

------------------------------------------------------------------------

## 17) Deliverables Checklist (MVP)

-   [ ] Licensing server (activate/refresh/revoke, signed entitlements,
    webhooks)
-   [ ] Panel API + Web UI (auth, orgs, RBAC, nodes, servers, mods,
    players)
-   [ ] Node agent (SteamCMD, lifecycle, RCON, backups, metrics)
-   [ ] Game templates for 5 popular titles (CS2, Valheim, ARK: SA, SE,
    Minecraft\*)
-   [ ] Stripe billing, plans, entitlements, invoices in UI
-   [ ] Audit logs, alerts, dashboards, backup/restore
-   [ ] Docs: install, ops, template SDK, plugin SDK

\* Minecraft via official server jars/EULA flow; not SteamCMD but
supported via template adapter.

------------------------------------------------------------------------

## 18) Next Steps

1.  Confirm MVP game list and licensing plans/tiers.
2.  Choose core language pairing (TS/Go or Go‑only) and finalize
    template format (JSON vs CUE).
3.  Create private repo + bootstrap CI/CD and codeowners.
4.  Implement Licensing Server first; then Panel auth/RBAC; then Agent +
    two reference games.

------------------------------------------------------------------------

### Appendix A --- Example Template (simplified JSON)

``` json
{
  "schemaVersion": 1,
  "gameId": "cs2",
  "displayName": "Counter‑Strike 2",
  "steamAppId": 730,
  "ports": [{ "name": "game", "containerPort": 27015, "protocol": "udp" }],
  "env": { "MAX_PLAYERS": 16 },
  "rcon": { "enabled": true, "port": 27015 },
  "query": { "protocol": "source" },
  "workshop": { "enabled": true },
  "commands": {
    "start": "./srcds_run -game csgo -tickrate 128 -port $PORT_game"
  }
}
```

### Appendix B --- Example Agent Install (concept)

``` bash
curl -fsSL https://panel.example.com/agent/install.sh | sudo bash -s --   --panel=https://panel.example.com   --join-token=eyJhbGciOiJFZERTQSJ9....   --node-name=node-01
```

### Appendix C --- Example Entitlement (JWT payload)

``` json
{
  "iss": "lic.example.com",
  "sub": "org_123",
  "plan": "pro",
  "features": ["mods", "backups", "sso"],
  "limits": {"nodes": 5, "servers": 50},
  "exp": 1759363200,
  "jti": "e3f7..."
}
```
