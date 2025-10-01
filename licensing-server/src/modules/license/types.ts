import { z } from 'zod';

export const ActivationRequest = z.object({
  orgId: z.string().min(3),
  activationCode: z.string().min(6),
  plan: z.string().default('dev'),
});

export const RefreshRequest = z.object({
  token: z.string().min(16),
});

export const RevokeRequest = z.object({
  jti: z.string().min(8),
  reason: z.string().default('manual'),
});

export type ActivationRequestT = z.infer<typeof ActivationRequest>;
export type RefreshRequestT = z.infer<typeof RefreshRequest>;
export type RevokeRequestT = z.infer<typeof RevokeRequest>;
