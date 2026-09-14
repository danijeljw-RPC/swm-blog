CREATE TABLE submissions (
  id TEXT PRIMARY KEY,
  public_reference TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK (kind IN ('story', 'guest')),
  created_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewing','contacted','shortlisted','scheduled','declined','used','archived')),
  name TEXT, pseudonym TEXT, email TEXT, timezone TEXT,
  submission_type TEXT CHECK (submission_type IS NULL OR submission_type IN ('story','question','topic','other')),
  identity_preference TEXT CHECK (identity_preference IS NULL OR identity_preference IN ('name','pseudonym','anonymous')),
  publication_permission TEXT CHECK (publication_permission IS NULL OR publication_permission IN ('read','paraphrase','private')),
  contact_permission INTEGER CHECK (contact_permission IS NULL OR contact_permission IN (0,1)),
  content TEXT NOT NULL, about TEXT, why_swm TEXT, website TEXT, social_links TEXT,
  previous_appearances TEXT, topics TEXT, anything_else TEXT,
  recording_acknowledged INTEGER CHECK (recording_acknowledged IS NULL OR recording_acknowledged IN (0,1)),
  metadata TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX submissions_kind_created_at ON submissions(kind, created_at DESC);
CREATE INDEX submissions_status_created_at ON submissions(status, created_at DESC);

CREATE TABLE email_deliveries (
  submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  delivery_kind TEXT NOT NULL CHECK (delivery_kind IN ('internal','acknowledgement')),
  state TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','sent','failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  last_error_category TEXT,
  PRIMARY KEY (submission_id, delivery_kind)
);

CREATE TABLE submission_rate_limits (
  client_key TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  attempts INTEGER NOT NULL,
  PRIMARY KEY (client_key, window_start)
);
