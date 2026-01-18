import { z } from "zod";

export const userIdParamSchema = z.string().uuid();

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).nullable().optional(),
});

export type UpdateUserBody = z.infer<typeof updateUserSchema>;
