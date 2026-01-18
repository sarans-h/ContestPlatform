import bcrypt from "bcrypt";
import { Prisma } from "../../generated/prisma/client.ts";
import { prisma } from "../../lib/prisma.ts";

export type PublicUser = {
	id: string;
	email: string;
	name: string | null;
	role: "contestee" | "creator";
};

export type AuthResult = {
	user: PublicUser;
	tokenRole: "creator" | "contestee";
};

function toPublicUser(user: {
	id: string;
	email: string;
	name: string | null;
	password: string | null;
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

export class EmailAlreadyUsedError extends Error {
	name = "EmailAlreadyUsedError";
}

export class InvalidCredentialsError extends Error {
	name = "InvalidCredentialsError";
}

export async function signupUser(input: {
	email: string;
	name?: string;
	password: string;
	role?: "CONTESTEE" | "CREATOR";
}): Promise<AuthResult> {
	const hashedPassword = await bcrypt.hash(input.password, 10);

	try {
		const created = await prisma.user.create({
			data: {
				email: input.email,
				password: hashedPassword,
				...(input.name !== undefined ? { name: input.name } : {}),
				...(input.role !== undefined ? { role: input.role } : {}),
			},
			select: {
				id: true,
				email: true,
				name: true,
				password: true,
				role: true,
			},
		});

        const tokenRole=created.role==="CREATOR"?"creator":"contestee";

		return {
			user: toPublicUser(created),
			tokenRole,
		};
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			if (error.code === "P2002") {
				throw new EmailAlreadyUsedError("Email already used");
			}
		}
		throw error;
	}
}

export async function loginUser(input: {
	email: string;
	password: string;
}): Promise<AuthResult> {
	const user = await prisma.user.findUnique({
		where: { email: input.email },
		select: {
			id: true,
			email: true,
			name: true,
			password: true,
			role: true,
		},
	});

	if (!user?.password) {
		throw new InvalidCredentialsError("Invalid email or password");
	}

	const ok = await bcrypt.compare(input.password, user.password);
	if (!ok) {
		throw new InvalidCredentialsError("Invalid email or password");
	}
const tokenRole=user.role==="CREATOR"?"creator":"contestee";

	return {
		user: toPublicUser(user),
		tokenRole
	};
}
