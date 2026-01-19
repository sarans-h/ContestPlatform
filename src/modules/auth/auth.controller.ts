import type { NextFunction, Request, Response } from "express";
import {
	EmailAlreadyUsedError,
	InvalidCredentialsError,
	loginUser,
	signupUser,
} from "./auth.service.ts";
import { parseBody } from "../../lib/validation.ts";
import { loginSchema, signupSchema } from "./auth.schema.ts";
import { signAuthToken } from "../../lib/jwt.ts";
import { fail, ok } from "../../lib/response.ts";

export async function signup(req: Request, res: Response, next: NextFunction) {
	const body = parseBody(signupSchema, req.body, res);
	if (!body) return;

	try {
		const { email, password, name, role } = body;
		const result = await signupUser({
			email,
			password,
			...(name !== undefined ? { name } : {}),
			...(role !== undefined
				? { role: role === "creator" ? "CREATOR" : "CONTESTEE" }
				: { role: "CONTESTEE" }),
		});
		// As requested: signup returns only the user object in data (no token)
		return ok(res, result.user, 201);
	} catch (error) {
		if (error instanceof EmailAlreadyUsedError) {
			return fail(res, "EMAIL_ALREADY_EXISTS", 400);
		}
		return next(error);
	}
}

export async function login(req: Request, res: Response, next: NextFunction) {
	const body = parseBody(loginSchema, req.body, res);
	if (!body) return;

	try {
		const result = await loginUser(body);

        const token = signAuthToken({
            sub: result.user.id,
            email: result.user.email,
            role: result.tokenRole,
        });

        return ok(res, { token }, 200);
	} catch (error) {
		if (error instanceof InvalidCredentialsError) {
			return fail(res, "INVALID_CREDENTIALS", 401);
		}
		return next(error);
	}
}
