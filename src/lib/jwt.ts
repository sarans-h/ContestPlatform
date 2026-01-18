import jwt from "jsonwebtoken";

export type AuthTokenPayload = {
  sub: string; // userId
  email: string;
  role: "contestee" | "creator";
};

function getJwtSecret(): string {
  const fromEnv = process.env.JWT_SECRET;
  if (fromEnv && fromEnv.trim().length > 0) return fromEnv;

  // Dev-friendly default. Set JWT_SECRET in production.
  if (process.env.NODE_ENV !== "production") return "dev-jwt-secret-change-me";

  throw new Error("JWT_SECRET is not set");
}

export function signAuthToken(payload: AuthTokenPayload): string {
  const secret = getJwtSecret();
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  const secret = getJwtSecret();
  const decoded = jwt.verify(token, secret);

  if (typeof decoded !== "object" || decoded === null) {
    throw new Error("Invalid token payload");
  }

  const { sub, email, role } = decoded as Partial<AuthTokenPayload>;
  if (!sub || !email || !role) {
    throw new Error("Invalid token payload");
  }

  return { sub, email, role };
}
