import assert from "node:assert/strict";
import test from "node:test";
import { handleStatusUpdate } from "../src/lib/admin/mutation.ts";
import type { AdminIdentity } from "../src/lib/admin/access.ts";

const identity: AdminIdentity = { email: "admin@sisterswithmirrors.com", subject: "user-1" };
const expectedOrigin = "https://sisterswithmirrors.com";
const now = () => new Date("2026-09-14T00:00:00.000Z");

class FakeRepository {
  public calls: unknown[] = [];
  constructor(private result: boolean | Error = true) {}
  async updateStatus(input: unknown) {
    this.calls.push(input);
    if (this.result instanceof Error) throw this.result;
    return this.result;
  }
}

function makeRequest(options: { body?: string; contentType?: string | null; origin?: string | null; contentLength?: string | null } = {}) {
  const headers = new Headers();
  if (options.contentType !== null) headers.set("Content-Type", options.contentType ?? "application/x-www-form-urlencoded");
  if (options.origin !== null) headers.set("Origin", options.origin ?? expectedOrigin);
  if (options.contentLength !== undefined && options.contentLength !== null) headers.set("Content-Length", options.contentLength);
  return new Request("https://sisterswithmirrors.com/admin/submissions/SWM-S-AB23CD/status/", {
    method: "POST",
    headers,
    body: options.body ?? "status=contacted",
  });
}

test("rejects non-form content", async () => {
  const repository = new FakeRepository();
  const request = makeRequest({ contentType: "application/json" });
  const response = await handleStatusUpdate(request, "SWM-S-AB23CD", identity, repository as never, expectedOrigin, now);
  assert.equal(response.status, 400);
  assert.equal(repository.calls.length, 0);
});

test("rejects a body over 4 KiB", async () => {
  const repository = new FakeRepository();
  const body = `status=contacted&padding=${"a".repeat(5000)}`;
  const request = makeRequest({ body, contentLength: String(body.length) });
  const response = await handleStatusUpdate(request, "SWM-S-AB23CD", identity, repository as never, expectedOrigin, now);
  assert.equal(response.status, 400);
  assert.equal(repository.calls.length, 0);
});

test("rejects a missing Origin header", async () => {
  const repository = new FakeRepository();
  const request = makeRequest({ origin: null });
  const response = await handleStatusUpdate(request, "SWM-S-AB23CD", identity, repository as never, expectedOrigin, now);
  assert.equal(response.status, 403);
  assert.equal(repository.calls.length, 0);
});

test("rejects a mismatched Origin header", async () => {
  const repository = new FakeRepository();
  const request = makeRequest({ origin: "https://evil.example" });
  const response = await handleStatusUpdate(request, "SWM-S-AB23CD", identity, repository as never, expectedOrigin, now);
  assert.equal(response.status, 403);
  assert.equal(repository.calls.length, 0);
});

test("rejects a malformed reference", async () => {
  const repository = new FakeRepository();
  const request = makeRequest();
  const response = await handleStatusUpdate(request, "not-a-reference", identity, repository as never, expectedOrigin, now);
  assert.equal(response.status, 400);
  assert.equal(repository.calls.length, 0);
});

test("rejects a missing status field", async () => {
  const repository = new FakeRepository();
  const request = makeRequest({ body: "" });
  const response = await handleStatusUpdate(request, "SWM-S-AB23CD", identity, repository as never, expectedOrigin, now);
  assert.equal(response.status, 400);
  assert.equal(repository.calls.length, 0);
});

test("rejects duplicate status fields", async () => {
  const repository = new FakeRepository();
  const request = makeRequest({ body: "status=contacted&status=archived" });
  const response = await handleStatusUpdate(request, "SWM-S-AB23CD", identity, repository as never, expectedOrigin, now);
  assert.equal(response.status, 400);
  assert.equal(repository.calls.length, 0);
});

test("rejects an unknown status", async () => {
  const repository = new FakeRepository();
  const request = makeRequest({ body: "status=bogus" });
  const response = await handleStatusUpdate(request, "SWM-S-AB23CD", identity, repository as never, expectedOrigin, now);
  assert.equal(response.status, 400);
  assert.equal(repository.calls.length, 0);
});

test("returns 404 when the record is missing", async () => {
  const repository = new FakeRepository(false);
  const request = makeRequest();
  const response = await handleStatusUpdate(request, "SWM-S-AB23CD", identity, repository as never, expectedOrigin, now);
  assert.equal(response.status, 404);
});

test("valid request passes normalized reference, parsed status, verified email, and injected time, then redirects", async () => {
  const repository = new FakeRepository(true);
  const request = makeRequest({ body: "status=contacted" });
  const response = await handleStatusUpdate(request, "swm-s-ab23cd", identity, repository as never, expectedOrigin, now);

  assert.equal(response.status, 303);
  assert.equal(response.headers.get("Location"), "/admin/submissions/SWM-S-AB23CD/?updated=1");
  assert.deepEqual(repository.calls, [
    {
      reference: "SWM-S-AB23CD",
      status: "contacted",
      administratorEmail: "admin@sisterswithmirrors.com",
      updatedAt: "2026-09-14T00:00:00.000Z",
    },
  ]);
});

test("storage failure returns a generic 500 without the error message", async () => {
  const repository = new FakeRepository(new Error("db exploded with secret detail"));
  const request = makeRequest();
  const response = await handleStatusUpdate(request, "SWM-S-AB23CD", identity, repository as never, expectedOrigin, now);
  assert.equal(response.status, 500);
  const text = await response.text();
  assert.doesNotMatch(text, /secret detail/);
});
