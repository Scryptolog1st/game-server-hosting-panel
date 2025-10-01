import { z } from 'zod';

export const RegisterDTO = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  orgName: z.string().min(3),
});

export const LoginDTO = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
