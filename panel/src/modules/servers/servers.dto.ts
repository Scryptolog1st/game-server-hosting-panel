import { z } from 'zod';

export const CreateServerDTO = z.object({
  name: z.string().min(3),
  gameId: z.string().min(2),
  nodeId: z.string().optional(),
  ports: z.any().optional(),
  config: z.any().optional(),
});

export const UpdateServerDTO = z.object({
  name: z.string().min(3).optional(),
  nodeId: z.string().nullable().optional(),
  status: z.enum(['running','stopped','starting','failed']).optional(),
  ports: z.any().optional(),
  config: z.any().optional(),
});
