import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(6).max(200),
  role: z.enum(["contestee", "creator"]).optional(),
})
.strict();

export type SignupBody = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
}).strict();

export type LoginBody = z.infer<typeof loginSchema>;
