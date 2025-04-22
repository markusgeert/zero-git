import { type } from "arktype";

/** The contents of the JWT */
export const AuthDataSchema = type({
	sub: "string",
	role: "'crew' | 'user'",
	name: "string",
	iat: "number",
	exp: "number",
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
