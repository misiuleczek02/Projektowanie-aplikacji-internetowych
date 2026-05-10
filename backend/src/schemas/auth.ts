import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Niepoprawny email'),
  password: z.string().min(8, 'Hasło musi mieć min. 8 znaków'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
