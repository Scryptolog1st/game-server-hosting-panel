# Architecture Overview

- Panel (API + Web Admin): NestJS + Fastify, PostgreSQL, NATS, MinIO (S3-compatible)
- Licensing Server: NestJS, Ed25519 tokens for entitlements
- Agent: Go binary, gRPC (mTLS) control, runs SteamCMD & manages containers

See the roadmap for full details.
