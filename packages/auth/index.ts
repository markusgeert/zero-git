import { createSubjects } from "@openauthjs/openauth/subject";
import { type } from "arktype";

export const subjects = createSubjects({
	user: type({
		id: "string",
		email: "string",
	}),
});

/** The contents of the JWT */
export const AuthDataSchema = type({
	mode: "string",
	type: "string",
	aud: "string",
	iss: "string",
	sub: "string",
	exp: "number",
	properties: subjects.user,
});

export type AuthData = typeof AuthDataSchema.infer;

export function assert(x: unknown, message?: string): asserts x {
	if (!x) throw new Error(message);
}

export function must<T>(v: T | undefined | null, msg?: string): T {
	// eslint-disable-next-line eqeqeq
	if (v == null) {
		throw new Error(msg ?? `Unexpected ${v} value`);
	}
	return v;
}
