import { z } from 'zod';

export const createHabitSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  categoryId: z.number().int().positive(),
});

export const updateHabitSchema = createHabitSchema.partial();

export const createCheckinSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data w formacie YYYY-MM-DD')
    .optional(),
});

export type CreateHabitInput = z.infer<typeof createHabitSchema>;
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;
export type CreateCheckinInput = z.infer<typeof createCheckinSchema>;
