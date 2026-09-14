import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("migration 0002 adds nullable admin columns and supporting indexes", async () => {
  const sql = await readFile(
    new URL("../migrations/0002_add_submission_admin_fields.sql", import.meta.url),
    "utf8",
  );

  assert.match(sql, /ALTER TABLE submissions ADD COLUMN updated_at TEXT/i);
  assert.match(sql, /ALTER TABLE submissions ADD COLUMN status_updated_by TEXT/i);
  assert.doesNotMatch(sql, /NOT NULL/i);
  assert.match(sql, /CREATE INDEX IF NOT EXISTS[^;]*\(\s*status\s*,\s*created_at DESC\s*\)/i);
  assert.match(sql, /CREATE INDEX IF NOT EXISTS[^;]*\(\s*kind\s*,\s*submission_type\s*,\s*created_at DESC\s*\)/i);
  assert.doesNotMatch(sql, /DROP TABLE/i);
  assert.doesNotMatch(sql, /DELETE FROM/i);
});
