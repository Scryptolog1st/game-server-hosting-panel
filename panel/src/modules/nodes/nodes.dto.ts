//panel/src/modules/nodes/nodes.dto.ts


import { z } from 'zod';

export const CreateTokenDTO = z.object({
  // Optional TTL in minutes (default 60 min)
  ttlMinutes: z.number().min(5).max(1440).optional(),
});

export const EnrollNodeDTO = z.object({
  token: z.string().min(20),
  name: z.string().min(2),
  hostname: z.string().min(2),
});

export const HeartbeatDTO = z.object({
  nodeId: z.string().min(10),
  nodeKey: z.string().min(20),
  status: z.enum(['online', 'offline', 'unknown']).optional(),
});

export const UpdateNodeDTO = z.object({
  name: z.string().min(1).optional(),
  hostname: z.string().min(1).optional(),
  agentUrl: z.string().url().optional(),
});
