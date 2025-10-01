import { Injectable } from '@nestjs/common';
import { generateKeyPair, exportJWK, SignJWT, jwtVerify, importJWK } from 'jose';
import { randomBytes, createHash } from 'crypto';
import { env } from '../config/config';

type CRLEntry = { jti: string; reason: string; revokedAt: string };

@Injectable()
export class LicenseService {
  private keyPromise: Promise<CryptoKeyPair>;
  private crl: Map<string, CRLEntry> = new Map();

  constructor() {
    this.keyPromise = this.initKey();
  }

  private async initKey(): Promise<CryptoKeyPair> {
    // In prod, use KMS/Vault. For dev, derive a deterministic key if LICENSE_SIGNING_SEED is set.
    if (env.LICENSE_SIGNING_SEED) {
      const seedBytes = Buffer.from(env.LICENSE_SIGNING_SEED, 'base64');
      // Deterministic keypair is non-trivial with WebCrypto; for demo we fallback to generated key.
      // In production, fetch from secure storage.
    }
    return generateKeyPair('EdDSA');
  }

  async signEntitlement(payload: Record<string, unknown>, exp: string = '7d') {
    const { privateKey } = await this.keyPromise;
    const jti = randomBytes(16).toString('hex');
    return await new SignJWT({ ...payload })
      .setProtectedHeader({ alg: 'EdDSA' })
      .setJti(jti)
      .setIssuedAt()
      .setIssuer('licensing.local')
      .setExpirationTime(exp)
      .sign(privateKey);
  }

  async verify(token: string) {
    const { publicKey } = await this.keyPromise;
    const res = await jwtVerify(token, publicKey, { issuer: 'licensing.local' });
    const jti = res.payload.jti as string;
    if (jti && this.crl.has(jti)) {
      throw new Error('Token revoked');
    }
    return res;
  }

  async getPublicJwk() {
    const { publicKey } = await this.keyPromise;
    return await exportJWK(publicKey);
  }

  async revoke(jti: string, reason = 'manual'): Promise<CRLEntry> {
    const entry = { jti, reason, revokedAt: new Date().toISOString() };
    this.crl.set(jti, entry);
    return entry;
  }

  listCRL() {
    return Array.from(this.crl.values());
  }
}
