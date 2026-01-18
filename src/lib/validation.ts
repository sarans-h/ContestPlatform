import type { Response } from "express";
import type { ZodSchema } from "zod";
import { fail } from "./response.ts";



export function parseBody<T>(schema: ZodSchema<T>, body: unknown, res: Response): T | undefined {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    fail(res, "INVALID_REQUEST", 400);
    return undefined;
  }
  return parsed.data;
}

export function parseParam<T>(schema: ZodSchema<T>, value: unknown, res: Response): T | undefined {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    fail(res, "INVALID_REQUEST", 400);
    return undefined;
  }
  return parsed.data;
}
