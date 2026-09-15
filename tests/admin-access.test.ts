import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { AccessDeniedError, verifyAccessRequest } from "../src/lib/admin/access.ts";

const teamDomain = "https://sisters-with-mirrors.cloudflareaccess.com";
const audience = "sisters-with-mirrors-admin";

async function createAssertion(overrides: Record<string, unknown> = {}) {
  const { privateKey, publicKey } = await generateKeyPair("RS256");
  const publicJwk = await exportJWK(publicKey);
  const verifier = createLocalJWKSet({ keys: [{ ...publicJwk, kid: "test-key", alg: "RS256", use: "sig" }] });
  const claims = {
    email: "admin@sisterswithmirrors.com",
    sub: "access-user-123",
    iss: teamDomain,
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 60,
    ...overrides,
  };
  const assertion = await new SignJWT({ email: claims.email })
    .setProtectedHeader({ alg: "RS256", kid: "test-key" })
    .setIssuer(String(claims.iss))
    .setAudience(claims.aud as string)
    .setSubject(String(claims.sub))
    .setExpirationTime(Number(claims.exp))
    .sign(privateKey);

  return { assertion, verifier };
}

test("valid Cloudflare Access assertion returns the verified email and subject", async () => {
  const { assertion, verifier } = await createAssertion();
  const request = new Request("https://sisterswithmirrors.com/admin", {
    headers: { "Cf-Access-Jwt-Assertion": assertion },
  });

  const identity = await verifyAccessRequest(request, { teamDomain, audience }, verifier);

  assert.deepEqual(identity, { email: "admin@sisterswithmirrors.com", subject: "access-user-123" });
});

for (const scenario of [
  { name: "a missing assertion", request: new Request("https://sisterswithmirrors.com/admin"), config: { teamDomain, audience } },
  { name: "missing configuration", request: undefined, config: { teamDomain: "", audience: "" } },
  { name: "an issuer mismatch", request: undefined, config: { teamDomain, audience }, claims: { iss: "https://other.cloudflareaccess.com" } },
  { name: "an audience mismatch", request: undefined, config: { teamDomain, audience }, claims: { aud: "another-admin-app" } },
  { name: "an expired token", request: undefined, config: { teamDomain, audience }, claims: { exp: Math.floor(Date.now() / 1000) - 60 } },
  { name: "a missing email", request: undefined, config: { teamDomain, audience }, claims: { email: undefined } },
] as const) {
  test(`rejects ${scenario.name}`, async () => {
    const { assertion, verifier } = await createAssertion(scenario.claims);
    const request = scenario.request ?? new Request("https://sisterswithmirrors.com/admin", {
      headers: { "Cf-Access-Jwt-Assertion": assertion },
    });

    await assert.rejects(
      () => verifyAccessRequest(request, scenario.config, verifier),
      AccessDeniedError,
    );
  });
}

test("admin middleware protects root and descendants and makes successful responses private", async () => {
  const source = await readFile(new URL("../src/middleware.ts", import.meta.url), "utf8");

  assert.match(source, /pathname === "\/admin"/);
  assert.match(source, /pathname\.startsWith\("\/admin\/"\)/);
  assert.match(source, /context\.locals\.adminIdentity\s*=/);
  assert.match(source, /new Response\([^,]+,\s*\{\s*status:\s*403/);
  assert.match(source, /Cache-Control["']?\s*,?\s*["']private, no-store/);
  assert.match(source, /X-Robots-Tag["']?\s*,?\s*["']noindex, nofollow/);
});
