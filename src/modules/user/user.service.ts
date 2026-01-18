import { prisma } from "../../lib/prisma.ts";

export type PublicUser = {
	id: string;
	email: string;
	name: string | null;
	role: "contestee" | "creator";
};

export class UserNotFoundError extends Error {
	name = "UserNotFoundError";
}

function toPublicUser(user: {
	id: string;
	email: string;
	name: string | null;
	role: unknown;
}): PublicUser {
	const role = String(user.role);
	return {
		id: user.id,
		email: user.email,
		name: user.name,
		role: role === "CREATOR" ? "creator" : "contestee",
	};
}

export async function listUsers(): Promise<PublicUser[]> {
	const users = await prisma.user.findMany({
		orderBy: { createdAt: "desc" },
		select: {
			id: true,
			email: true,
			name: true,
			role: true,
		},
	});

	return users.map(toPublicUser);
}

export async function getUserById(id: string): Promise<PublicUser> {
	const user = await prisma.user.findUnique({
		where: { id },
		select: {
			id: true,
			email: true,
			name: true,
			role: true,
		},
	});

	if (!user) throw new UserNotFoundError("User not found");
	return toPublicUser(user);
}

export async function updateUserById(
	id: string,
	data: { name?: string | null }
): Promise<PublicUser> {
	const updated = await prisma.user.update({
		where: { id },
		data: {
			...(data.name !== undefined ? { name: data.name } : {}),
		},
		select: {
			id: true,
			email: true,
			name: true,
			role: true,
		},
	});

	return toPublicUser(updated);
}

export async function deleteUserById(id: string): Promise<void> {
	await prisma.user.delete({ where: { id } });
}
