import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "../generated/prisma/client.ts";
import { fail } from "../lib/response.ts";

export function notFoundHandler(req: Request, res: Response) {
  return fail(res, "ROUTE_NOT_FOUND", 404);
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error("Unhandled error:", err);

  // Express JSON body parser
  if (err instanceof SyntaxError && (err as any).type === "entity.parse.failed") {
    return fail(res, "INVALID_REQUEST", 400);
  }

  // Zod
  if (err instanceof ZodError) {
    return fail(res, "INVALID_REQUEST", 400);
  }

  // Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Record not found
    if (err.code === "P2025") {
      return fail(res, "NOT_FOUND", 404);
    }

    // Unique constraint violation
    if (err.code === "P2002") {
      return fail(res, "CONFLICT", 409);
    }

    return fail(res, "DB_ERROR", 400);
  }

  // Fallback
  return fail(res, "INTERNAL_ERROR", 500);
}
