import { Injectable } from '@nestjs/common';
import { createSecretKey, randomBytes } from 'crypto';
import { SignJWT, generateKeyPair, exportJWK } from 'jose';

@Injectable()
export class LicenseService {
  // In production, use Ed25519 key from KMS/Vault. Here we demo ephemeral keys.
  private keyPromise = generateKeyPair('EdDSA');

  async signEntitlement(payload: Record<string, unknown>) {
    const { privateKey } = await this.keyPromise;
    const jti = randomBytes(16).toString('hex');
    return await new SignJWT({ ...payload })
      .setProtectedHeader({ alg: 'EdDSA' })
      .setJti(jti)
      .setIssuedAt()
      .setIssuer('licensing.local')
      .setExpirationTime('7d')
      .sign(privateKey);
  }

  async getPublicJwk() {
    const { publicKey } = await this.keyPromise;
    return await exportJWK(publicKey);
  }
}
