import assert from "node:assert/strict";
import test from "node:test";
import { createSubmissionIdentity } from "../src/lib/submissions/references.ts";
import { escapeHtml, renderAcknowledgement, renderInternalNotification } from "../src/lib/submissions/notifications.ts";
import { verifyTurnstile } from "../src/lib/submissions/turnstile.ts";

test("public references expose kind without ambiguous characters", () => {
  for (const kind of ["story", "guest"] as const) {
    const value = createSubmissionIdentity(kind);
    assert.match(value.id, /^[0-9a-f-]{36}$/);
    assert.match(value.publicReference, kind === "story" ? /^SWM-S-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/ : /^SWM-G-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/);
  }
});

test("notification HTML escapes submitted content", () => {
  assert.equal(escapeHtml(`<img src=x onerror="bad"> & hi`), "&lt;img src=x onerror=&quot;bad&quot;&gt; &amp; hi");
});

test("acknowledgements do not promise publication or a reply", () => {
  const story = renderAcknowledgement({ kind: "story", publicReference: "SWM-S-ABC234", publicationPermission: "read" });
  const guest = renderAcknowledgement({ kind: "guest", publicReference: "SWM-G-ABC234" });
  assert.match(story.text, /may include it/); assert.doesNotMatch(story.text, /will include/);
  assert.match(guest.text, /if we'd like to organise/); assert.doesNotMatch(guest.text, /we'll respond to everyone/i);
});

test("internal notification includes the reference and safely escaped content", () => {
  const message = renderInternalNotification({ publicReference: "SWM-S-ABC234", kind: "story", createdAt: "2026-09-14T00:00:00Z", displayIdentity: "Anonymous", email: null, permission: "private", content: "<secret>", details: [] });
  assert.match(message.text, /SWM-S-ABC234/); assert.match(message.html, /&lt;secret&gt;/); assert.doesNotMatch(message.html, /<secret>/);
});

test("Turnstile requires matching action and hostname", async () => {
  const fetcher = async () => new Response(JSON.stringify({ success: true, action: "share-story", hostname: "sisterswithmirrors.com" }));
  assert.deepEqual(await verifyTurnstile("token", { secret: "secret", action: "share-story", allowedHostnames: ["sisterswithmirrors.com"] }, fetcher), { success: true });
  assert.equal((await verifyTurnstile("token", { secret: "secret", action: "be-a-guest", allowedHostnames: ["sisterswithmirrors.com"] }, fetcher)).success, false);
  assert.equal((await verifyTurnstile("token", { secret: "secret", action: "share-story", allowedHostnames: ["elsewhere.example"] }, fetcher)).success, false);
});

test("Turnstile test response is accepted only with the published test secret and explicit test mode", async () => {
  const fetcher = async () => new Response(JSON.stringify({ success: true, hostname: "example.com" }));
  const base = { secret: "1x0000000000000000000000000000000AA", action: "share-story", allowedHostnames: ["localhost"] };
  assert.equal((await verifyTurnstile("token", { ...base, testMode: true }, fetcher)).success, true);
  assert.equal((await verifyTurnstile("token", { ...base, secret: "production-secret", testMode: true }, fetcher)).success, false);
});
