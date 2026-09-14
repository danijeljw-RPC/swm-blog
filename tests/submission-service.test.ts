import assert from "node:assert/strict";
import test from "node:test";
import { createSubmissionService } from "../src/lib/submissions/service.ts";

const payload = { submissionType: "story", identityPreference: "anonymous", email: "", content: "A strange light.", publicationPermission: "private", contactPermission: false, turnstileToken: "token", websiteCompany: "" };

test("service persists before notification and accepts an email failure", async () => {
  const events: string[] = [];
  const service = createSubmissionService({ repository: { consumeRateLimit: async () => true, create: async () => { events.push("persist"); }, markDelivery: async (_, kind, state) => { events.push(`${kind}:${state}`); } }, notifier: { notifyNewSubmission: async () => { events.push("notify"); throw new Error("mail"); }, acknowledgeSubmission: async () => {} }, verify: async () => ({ success: true }), now: () => new Date("2026-09-14T00:00:00Z") });
  const result = await service.submitStory(payload, { clientAddress: "1.2.3.4", hostname: "sisterswithmirrors.com" });
  assert.equal(result.kind, "accepted");
  assert.equal(events[0], "persist");
  assert.deepEqual(events.slice(1), ["notify", "internal:failed"]);
});

test("service rejects honeypot and rate-limited requests before persistence", async () => {
  let writes = 0;
  const dependencies = { repository: { consumeRateLimit: async () => false, create: async () => { writes++; }, markDelivery: async () => {} }, notifier: { notifyNewSubmission: async () => {}, acknowledgeSubmission: async () => {} }, verify: async () => ({ success: true } as const) };
  assert.equal((await createSubmissionService(dependencies).submitStory({ ...payload, websiteCompany: "bot" }, { clientAddress: "x", hostname: "localhost" })).kind, "spam");
  assert.equal((await createSubmissionService(dependencies).submitStory(payload, { clientAddress: "x", hostname: "localhost" })).kind, "rate_limited");
  assert.equal(writes, 0);
});

test("honeypot wins over malformed field details", async () => {
  const service = createSubmissionService({ repository: { consumeRateLimit: async () => true, create: async () => {}, markDelivery: async () => {} }, notifier: { notifyNewSubmission: async () => {}, acknowledgeSubmission: async () => {} }, verify: async () => ({ success: true }) });
  assert.deepEqual(await service.submitStory({ websiteCompany: "bot" }, { clientAddress: "x", hostname: "localhost" }), { kind: "spam" });
});

test("delivery tracking failure cannot conceal an accepted persisted submission", async () => {
  const service = createSubmissionService({ repository: { consumeRateLimit: async () => true, create: async () => {}, markDelivery: async () => { throw new Error("tracking unavailable"); } }, notifier: { notifyNewSubmission: async () => {}, acknowledgeSubmission: async () => {} }, verify: async () => ({ success: true }) });
  assert.equal((await service.submitStory(payload, { clientAddress: "x", hostname: "localhost" })).kind, "accepted");
});
