import assert from "node:assert/strict";
import test from "node:test";
import {
  D1AdminSubmissionRepository,
} from "../src/lib/admin/repository.ts";
import {
  normalizePublicReference,
  parsePage,
  parseSubmissionFilter,
  parseSubmissionStatus,
  SUBMISSION_STATUSES,
} from "../src/lib/admin/submissions.ts";

test("parseSubmissionFilter accepts every requested filter value", () => {
  const filters = ["all", "new", "stories", "questions", "topics", "guests", "contacted", "shortlisted", "scheduled", "declined", "used", "archived", "reviewing"];
  for (const filter of filters) {
    assert.equal(parseSubmissionFilter(filter), filter);
  }
});

test("parseSubmissionFilter falls back to all for unknown values", () => {
  assert.equal(parseSubmissionFilter("nonsense"), "all");
  assert.equal(parseSubmissionFilter(null), "all");
  assert.equal(parseSubmissionFilter(undefined), "all");
  assert.equal(parseSubmissionFilter(""), "all");
});

test("parsePage returns bounded positive integers", () => {
  assert.equal(parsePage("1"), 1);
  assert.equal(parsePage("5"), 5);
  assert.equal(parsePage("0"), 1);
  assert.equal(parsePage("-3"), 1);
  assert.equal(parsePage("abc"), 1);
  assert.equal(parsePage(null), 1);
  assert.equal(parsePage("999999999999"), 1);
});

test("every lifecycle status parses", () => {
  for (const status of SUBMISSION_STATUSES) {
    const result = parseSubmissionStatus(status);
    assert.deepEqual(result, { valid: true, status });
  }
});

test("unknown statuses are invalid", () => {
  assert.deepEqual(parseSubmissionStatus("bogus"), { valid: false });
  assert.deepEqual(parseSubmissionStatus(""), { valid: false });
  assert.deepEqual(parseSubmissionStatus(null), { valid: false });
});

test("normalizePublicReference uppercases only matching references", () => {
  assert.equal(normalizePublicReference("swm-s-ab23cd"), "SWM-S-AB23CD");
  assert.equal(normalizePublicReference("SWM-G-XY98ZQ"), "SWM-G-XY98ZQ");
  assert.equal(normalizePublicReference("not-a-reference"), null);
  assert.equal(normalizePublicReference("SWM-X-AB23CD"), null);
  assert.equal(normalizePublicReference("SWM-S-AB23C"), null);
  assert.equal(normalizePublicReference(""), null);
});

interface RecordedStatement {
  sql: string;
  bindings: unknown[];
}

class FakeD1PreparedStatement {
  constructor(
    private readonly sql: string,
    private readonly recorder: RecordedStatement[],
    private readonly responder: (sql: string, bindings: unknown[]) => unknown,
  ) {}
  private bindings: unknown[] = [];
  bind(...values: unknown[]): FakeD1PreparedStatement {
    const next = new FakeD1PreparedStatement(this.sql, this.recorder, this.responder);
    next.bindings = values;
    return next;
  }
  async first<T>(): Promise<T | null> {
    this.recorder.push({ sql: this.sql, bindings: this.bindings });
    const result = this.responder(this.sql, this.bindings);
    return (result ?? null) as T | null;
  }
  async all<T>(): Promise<{ results: T[] }> {
    this.recorder.push({ sql: this.sql, bindings: this.bindings });
    const result = this.responder(this.sql, this.bindings);
    return { results: (result ?? []) as T[] };
  }
  async run(): Promise<{ meta: { changes: number } }> {
    this.recorder.push({ sql: this.sql, bindings: this.bindings });
    const result = this.responder(this.sql, this.bindings) as { changes: number } | undefined;
    return { meta: { changes: result?.changes ?? 0 } };
  }
}

class FakeD1Database {
  public statements: RecordedStatement[] = [];
  constructor(private responder: (sql: string, bindings: unknown[]) => unknown = () => undefined) {}
  prepare(sql: string): FakeD1PreparedStatement {
    return new FakeD1PreparedStatement(sql, this.statements, this.responder);
  }
}

test("list binds filter values, paginates, and orders deterministically", async () => {
  const db = new FakeD1Database((sql) => {
    if (/COUNT\(\*\)/i.test(sql)) return { total: 0 };
    return [];
  });
  const repository = new D1AdminSubmissionRepository(db as unknown as D1Database);

  await repository.list({ filter: "stories", page: 2, pageSize: 25 });

  const listStatement = db.statements.find((entry) => /LIMIT \? OFFSET \?/i.test(entry.sql));
  assert.ok(listStatement, "expected a LIMIT ? OFFSET ? query");
  assert.match(listStatement!.sql, /ORDER BY created_at DESC, id DESC/);
  assert.deepEqual(listStatement!.bindings.slice(-2), [25, 25]);

  for (const statement of db.statements) {
    assert.doesNotMatch(statement.sql, /\$\{/);
  }
});

test("findByReference binds a single normalized reference", async () => {
  const db = new FakeD1Database(() => null);
  const repository = new D1AdminSubmissionRepository(db as unknown as D1Database);

  await repository.findByReference("swm-s-ab23cd");

  const statement = db.statements.at(-1);
  assert.ok(statement);
  assert.equal(statement!.bindings.length, 1);
  assert.equal(statement!.bindings[0], "SWM-S-AB23CD");
});

test("updateStatus binds status, timestamp, administrator email, and reference", async () => {
  const db = new FakeD1Database(() => ({ changes: 1 }));
  const repository = new D1AdminSubmissionRepository(db as unknown as D1Database);

  const updated = await repository.updateStatus({
    reference: "swm-g-xy98zq",
    status: "contacted",
    administratorEmail: "admin@sisterswithmirrors.com",
    updatedAt: "2026-09-14T00:00:00.000Z",
  });

  assert.equal(updated, true);
  const statement = db.statements.at(-1);
  assert.ok(statement);
  assert.deepEqual(statement!.bindings, [
    "contacted",
    "2026-09-14T00:00:00.000Z",
    "admin@sisterswithmirrors.com",
    "SWM-G-XY98ZQ",
  ]);
});

test("updateStatus returns false when no row changed", async () => {
  const db = new FakeD1Database(() => ({ changes: 0 }));
  const repository = new D1AdminSubmissionRepository(db as unknown as D1Database);

  const updated = await repository.updateStatus({
    reference: "SWM-G-XY98ZQ",
    status: "archived",
    administratorEmail: "admin@sisterswithmirrors.com",
    updatedAt: "2026-09-14T00:00:00.000Z",
  });

  assert.equal(updated, false);
});
