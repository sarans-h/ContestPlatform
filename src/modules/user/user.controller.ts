import type { Request, Response } from "express";
import { z } from "zod";
import {
	UserNotFoundError,
	deleteUserById,
	getUserById,
	listUsers,
	updateUserById,
} from "./user.service.ts";

const idSchema = z.string().uuid();

const updateUserSchema = z.object({
	name: z.string().min(1).max(100).nullable().optional(),
});

export async function getUsers(_req: Request, res: Response) {
	const users = await listUsers();
	return res.status(200).json({ users });
}

export async function getUser(req: Request, res: Response) {
	const parsedId = idSchema.safeParse(req.params.id);
	if (!parsedId.success) {
		return res.status(400).json({ message: "Invalid user id" });
	}

	try {
		const user = await getUserById(parsedId.data);
		return res.status(200).json({ user });
	} catch (error) {
		if (error instanceof UserNotFoundError) {
			return res.status(404).json({ message: error.message });
		}
		return res.status(500).json({ message: "Internal server error" });
	}
}

export async function patchUser(req: Request, res: Response) {
	const parsedId = idSchema.safeParse(req.params.id);
	if (!parsedId.success) {
		return res.status(400).json({ message: "Invalid user id" });
	}

	const parsedBody = updateUserSchema.safeParse(req.body);
	if (!parsedBody.success) {
		return res.status(400).json({
			message: "Invalid request body",
			issues: parsedBody.error.issues,
		});
	}

	try {
		const user = await updateUserById(parsedId.data, {
			...(parsedBody.data.name !== undefined ? { name: parsedBody.data.name } : {}),
		});
		return res.status(200).json({ user });
	} catch (error) {
		// Prisma throws if not found on update
		return res.status(404).json({ message: "User not found" });
	}
}

export async function removeUser(req: Request, res: Response) {
	const parsedId = idSchema.safeParse(req.params.id);
	if (!parsedId.success) {
		return res.status(400).json({ message: "Invalid user id" });
	}

	try {
		await deleteUserById(parsedId.data);
		return res.status(204).send();
	} catch (_error) {
		return res.status(404).json({ message: "User not found" });
	}
}
