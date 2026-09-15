import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";

export interface AdminIdentity {
  email: string;
  subject: string;
}

export interface AccessConfig {
  teamDomain: string;
  audience: string;
}

export class AccessDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AccessDeniedError";
  }
}

const jwksCache = new Map<string, JWTVerifyGetKey>();

function normalizeTeamDomain(teamDomain: string): URL {
  let url: URL;
  try {
    url = new URL(teamDomain);
  } catch {
    throw new AccessDeniedError("Invalid Cloudflare Access team domain");
  }
  if (url.protocol !== "https:") {
    throw new AccessDeniedError("Cloudflare Access team domain must use HTTPS");
  }
  if (!url.hostname.endsWith(".cloudflareaccess.com")) {
    throw new AccessDeniedError("Cloudflare Access team domain must be a cloudflareaccess.com host");
  }
  return url;
}

function getRemoteJwks(teamDomain: string): JWTVerifyGetKey {
  const cached = jwksCache.get(teamDomain);
  if (cached) return cached;
  const normalized = normalizeTeamDomain(teamDomain);
  const jwks = createRemoteJWKSet(new URL("/cdn-cgi/access/certs", normalized));
  jwksCache.set(teamDomain, jwks);
  return jwks;
}

export async function verifyAccessRequest(
  request: Request,
  config: AccessConfig,
  verifier?: JWTVerifyGetKey,
): Promise<AdminIdentity> {
  const teamDomain = config.teamDomain?.trim();
  const audience = config.audience?.trim();

  if (!teamDomain || !audience) {
    throw new AccessDeniedError("Cloudflare Access is not configured");
  }

  const normalizedTeamDomain = normalizeTeamDomain(teamDomain);

  const assertion = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!assertion) {
    throw new AccessDeniedError("Missing Cloudflare Access assertion");
  }

  const key = verifier ?? getRemoteJwks(teamDomain);

  let payload: Record<string, unknown>;
  try {
    const result = await jwtVerify(assertion, key, {
      issuer: normalizedTeamDomain.toString().replace(/\/$/, ""),
      audience,
    });
    payload = result.payload;
  } catch {
    throw new AccessDeniedError("Cloudflare Access assertion failed verification");
  }

  const email = payload.email;
  const subject = payload.sub;

  if (typeof email !== "string" || email.trim() === "") {
    throw new AccessDeniedError("Cloudflare Access assertion missing email claim");
  }
  if (typeof subject !== "string" || subject.trim() === "") {
    throw new AccessDeniedError("Cloudflare Access assertion missing subject claim");
  }

  return { email, subject };
}
