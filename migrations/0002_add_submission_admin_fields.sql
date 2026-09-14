ALTER TABLE submissions ADD COLUMN updated_at TEXT;
ALTER TABLE submissions ADD COLUMN status_updated_by TEXT;

CREATE INDEX IF NOT EXISTS submissions_status_created_at_admin ON submissions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS submissions_kind_submission_type_created_at ON submissions(kind, submission_type, created_at DESC);
