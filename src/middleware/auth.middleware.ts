import type { NextFunction, Request, Response } from "express";
import { verifyAuthToken } from "../lib/jwt.ts";
import { fail } from "../lib/response.ts";

function getBearerToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (!header) return undefined;

  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return undefined;
  return token;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = getBearerToken(req);
  if (!token) {
    return fail(res, "UNAUTHORIZED", 401);
  }

  try {
    const payload = verifyAuthToken(token);
    req.auth = {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    return next();
  } catch {
    return fail(res, "UNAUTHORIZED", 401);
  }
}

export function requireRole(role: string) {
  return function requireRoleMiddleware(req: Request, res: Response, next: NextFunction) {
    if (!req.auth) return fail(res, "UNAUTHORIZED", 401);
    if (req.auth.role !== role) return fail(res, "FORBIDDEN", 403);
    return next();
  };
}

export function requireSelfOrCreator(paramName: string) {
  return function requireSelfOrCreatorMiddleware(req: Request, res: Response, next: NextFunction) {
    if (!req.auth) return fail(res, "UNAUTHORIZED", 401);

    const id = req.params[paramName];
    if (!id) return fail(res, "VALIDATION_ERROR", 400);

    if (req.auth.role === "creator" || req.auth.userId === id) {
      return next();
    }

    return fail(res, "FORBIDDEN", 403);
  };
}
