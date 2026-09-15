import assert from "node:assert/strict";
import test from "node:test";
import { validateGuestSubmission, validateStorySubmission } from "../src/lib/submissions/validation.ts";

const story = { submissionType: "story", identityPreference: "anonymous", email: "", content: "  Something happened.  ", publicationPermission: "private", contactPermission: false, turnstileToken: "token", websiteCompany: "" };
const guest = { name: "Alex", preferredName: "", email: "alex@example.com", timezone: "Australia/Adelaide", about: "I have a story.", talkAbout: "Consciousness.", whySwm: "I enjoy the conversation.", website: "", socialLinks: "", previousAppearances: "", topics: ["consciousness"], anythingElse: "", recordingAcknowledged: true, turnstileToken: "token", websiteCompany: "" };

test("anonymous story is accepted without identifying fields", () => {
  const result = validateStorySubmission(story);
  assert.equal(result.success, true);
  if (result.success) assert.equal(result.data.content, "Something happened.");
});

test("named and pseudonymous stories require the selected identity", () => {
  assert.equal(validateStorySubmission({ ...story, identityPreference: "name" }).success, false);
  assert.equal(validateStorySubmission({ ...story, identityPreference: "pseudonym" }).success, false);
  assert.equal(validateStorySubmission({ ...story, identityPreference: "name", name: "DJ" }).success, true);
});

test("story rejects invalid permission, email, and oversized content", () => {
  assert.equal(validateStorySubmission({ ...story, publicationPermission: "automatic" }).success, false);
  assert.equal(validateStorySubmission({ ...story, email: "not-email" }).success, false);
  assert.equal(validateStorySubmission({ ...story, content: "x".repeat(20_001) }).success, false);
});

test("contact permission requires an email", () => {
  assert.equal(validateStorySubmission({ ...story, contactPermission: true }).success, false);
});

test("guest requires a valid contact email and recording acknowledgement", () => {
  assert.equal(validateGuestSubmission(guest).success, true);
  assert.equal(validateGuestSubmission({ ...guest, email: "bad" }).success, false);
  assert.equal(validateGuestSubmission({ ...guest, recordingAcknowledged: false }).success, false);
});

test("guest rejects invalid URLs and oversized descriptions", () => {
  assert.equal(validateGuestSubmission({ ...guest, website: "javascript:alert(1)" }).success, false);
  assert.equal(validateGuestSubmission({ ...guest, socialLinks: "https://example.com\nnot-a-url" }).success, false);
  assert.equal(validateGuestSubmission({ ...guest, about: "x".repeat(10_001) }).success, false);
});

test("booleans and topic values are not coerced from malformed payloads", () => {
  assert.equal(validateGuestSubmission({ ...guest, recordingAcknowledged: "true" }).success, false);
  assert.equal(validateGuestSubmission({ ...guest, topics: ["fame"] }).success, false);
});
