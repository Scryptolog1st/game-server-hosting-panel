# Threat Model (High Level)
- **Spoofed Node**: mitigated by mTLS with short-lived certs.
- **Stolen Tokens**: short-lived JWTs + rotation, bound to device when possible.
- **Command Injection**: strict template validators; shellouts avoided; use arg vectors.
- **Supply Chain**: SBOM + signed images + vulnerability scans.
- **Data Exfiltration**: least-privilege RBAC, per-tenant isolation, audit logs.
