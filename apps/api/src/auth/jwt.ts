import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

type JwtPayload = {
  sub: string;
  typ: "access" | "refresh";
  jti?: string;
  iat: number;
  exp: number;
};

function base64UrlEncode(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function base64UrlDecode(input: string): Buffer {
  const normalized = input.replaceAll("-", "+").replaceAll("_", "/");
  return Buffer.from(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="), "base64");
}

function sign(message: string, secret: string): string {
  return base64UrlEncode(createHmac("sha256", secret).update(message).digest());
}

export function signToken(
  subject: string,
  type: "access" | "refresh",
  secret: string,
  ttlSeconds: number
): string {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload: JwtPayload = {
    sub: subject,
    typ: type,
    jti: type === "refresh" ? randomUUID() : undefined,
    iat: now,
    exp: now + ttlSeconds
  };
  const body = base64UrlEncode(JSON.stringify(payload));
  const unsigned = `${header}.${body}`;

  return `${unsigned}.${sign(unsigned, secret)}`;
}

export function verifyToken(
  token: string,
  type: "access" | "refresh",
  secret: string
): JwtPayload {
  const [header, payload, signature] = token.split(".");

  if (!header || !payload || !signature) {
    throw new Error("Malformed token");
  }

  const unsigned = `${header}.${payload}`;
  const expectedSignature = sign(unsigned, secret);
  const actual = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new Error("Invalid token signature");
  }

  const parsed = JSON.parse(base64UrlDecode(payload).toString("utf8")) as JwtPayload;

  if (parsed.typ !== type) {
    throw new Error("Invalid token type");
  }

  if (parsed.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Expired token");
  }

  return parsed;
}
