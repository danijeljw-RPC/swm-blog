import type { DeliveryState } from "../submissions/repository";
import type {
  AdminSubmissionDetail,
  AdminSubmissionFilter,
  AdminSubmissionStatus,
  GuestAdminSubmissionDetail,
  StoryAdminSubmissionDetail,
  SubmissionListItem,
  SubmissionPage,
} from "./submissions";
import { normalizePublicReference, parseStringArray } from "./submissions";

interface FilterClause {
  where: string;
  bindings: unknown[];
}

const LIFECYCLE_FILTERS = new Set(["reviewing", "contacted", "shortlisted", "scheduled", "declined", "used", "archived"]);

function buildFilterClause(filter: AdminSubmissionFilter): FilterClause {
  switch (filter) {
    case "all":
      return { where: "1 = 1", bindings: [] };
    case "new":
      return { where: "status = ?", bindings: ["new"] };
    case "stories":
      return { where: "kind = ? AND submission_type = ?", bindings: ["story", "story"] };
    case "questions":
      return { where: "submission_type = ?", bindings: ["question"] };
    case "topics":
      return { where: "submission_type = ?", bindings: ["topic"] };
    case "guests":
      return { where: "kind = ?", bindings: ["guest"] };
    default:
      if (LIFECYCLE_FILTERS.has(filter)) {
        return { where: "status = ?", bindings: [filter] };
      }
      return { where: "1 = 1", bindings: [] };
  }
}

function excerptOf(row: Record<string, unknown>): string {
  const source = typeof row.content === "string" && row.content.trim() !== "" ? row.content : typeof row.talk_about === "string" ? row.talk_about : "";
  const trimmed = source.trim().replace(/\s+/g, " ");
  return trimmed.length > 160 ? `${trimmed.slice(0, 160)}…` : trimmed;
}

function displayIdentityOf(row: Record<string, unknown>): string {
  if (row.kind === "guest") {
    const preferred = typeof row.name === "string" ? row.name : "";
    return preferred || "Guest";
  }
  const identityPreference = row.identity_preference;
  if (identityPreference === "name" && typeof row.name === "string" && row.name) return row.name;
  if (identityPreference === "pseudonym" && typeof row.pseudonym === "string" && row.pseudonym) return row.pseudonym;
  return "Anonymous";
}

function toListItem(row: Record<string, unknown>): SubmissionListItem | null {
  const publicReference = row.public_reference;
  const kind = row.kind;
  const createdAt = row.created_at;
  const status = row.status;
  if (typeof publicReference !== "string" || (kind !== "story" && kind !== "guest") || typeof createdAt !== "string" || typeof status !== "string") {
    return null;
  }
  return {
    publicReference,
    kind,
    submissionType: typeof row.submission_type === "string" ? (row.submission_type as SubmissionListItem["submissionType"]) : null,
    createdAt,
    status: status as AdminSubmissionStatus,
    displayIdentity: displayIdentityOf(row),
    publicationPermission: typeof row.publication_permission === "string" ? (row.publication_permission as SubmissionListItem["publicationPermission"]) : null,
    contactPermission: typeof row.contact_permission === "number" ? row.contact_permission === 1 : null,
    excerpt: excerptOf(row),
  };
}

function toDetail(row: Record<string, unknown>, delivery: { internal: DeliveryState | null; acknowledgement: DeliveryState | null }): AdminSubmissionDetail | null {
  const publicReference = row.public_reference;
  const kind = row.kind;
  const createdAt = row.created_at;
  const status = row.status;
  if (typeof publicReference !== "string" || typeof createdAt !== "string" || typeof status !== "string") {
    return null;
  }
  const updatedAt = typeof row.updated_at === "string" ? row.updated_at : null;
  const statusUpdatedBy = typeof row.status_updated_by === "string" ? row.status_updated_by : null;

  if (kind === "story") {
    const submissionType = row.submission_type;
    const identityPreference = row.identity_preference;
    const publicationPermission = row.publication_permission;
    const content = row.content;
    if (
      typeof submissionType !== "string" ||
      typeof identityPreference !== "string" ||
      typeof publicationPermission !== "string" ||
      typeof content !== "string"
    ) {
      return null;
    }
    const detail: StoryAdminSubmissionDetail = {
      kind: "story",
      publicReference,
      createdAt,
      updatedAt,
      status: status as AdminSubmissionStatus,
      statusUpdatedBy,
      submissionType: submissionType as StoryAdminSubmissionDetail["submissionType"],
      identityPreference: identityPreference as StoryAdminSubmissionDetail["identityPreference"],
      name: typeof row.name === "string" ? row.name : null,
      pseudonym: typeof row.pseudonym === "string" ? row.pseudonym : null,
      email: typeof row.email === "string" ? row.email : null,
      content,
      publicationPermission: publicationPermission as StoryAdminSubmissionDetail["publicationPermission"],
      contactPermission: row.contact_permission === 1,
      delivery,
    };
    return detail;
  }

  if (kind === "guest") {
    const name = row.name;
    const email = row.email;
    const about = row.about;
    const talkAbout = row.content;
    const whySwm = row.why_swm;
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof about !== "string" ||
      typeof talkAbout !== "string" ||
      typeof whySwm !== "string"
    ) {
      return null;
    }
    const detail: GuestAdminSubmissionDetail = {
      kind: "guest",
      publicReference,
      createdAt,
      updatedAt,
      status: status as AdminSubmissionStatus,
      statusUpdatedBy,
      name,
      preferredName: null,
      email,
      timezone: typeof row.timezone === "string" ? row.timezone : null,
      about,
      talkAbout,
      whySwm,
      website: typeof row.website === "string" ? row.website : null,
      socialLinks: parseStringArray(row.social_links),
      previousAppearances: typeof row.previous_appearances === "string" ? row.previous_appearances : null,
      topics: parseStringArray(row.topics) as GuestAdminSubmissionDetail["topics"],
      anythingElse: typeof row.anything_else === "string" ? row.anything_else : null,
      recordingAcknowledged: row.recording_acknowledged === 1,
      delivery,
    };
    return detail;
  }

  return null;
}

export class D1AdminSubmissionRepository {
  constructor(private db: D1Database) {}

  async list(options: { filter: AdminSubmissionFilter; page: number; pageSize: number }): Promise<SubmissionPage> {
    const { filter, page, pageSize } = options;
    const clause = buildFilterClause(filter);
    const offset = (page - 1) * pageSize;

    const countRow = await this.db
      .prepare(`SELECT COUNT(*) as total FROM submissions WHERE ${clause.where}`)
      .bind(...clause.bindings)
      .first<{ total: number }>();
    const total = countRow?.total ?? 0;

    const listRow = await this.db
      .prepare(
        `SELECT public_reference, kind, submission_type, created_at, status, name, pseudonym, identity_preference, publication_permission, contact_permission, content FROM submissions WHERE ${clause.where} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
      )
      .bind(...clause.bindings, pageSize, offset)
      .all<Record<string, unknown>>();

    const items = listRow.results.map(toListItem).filter((item): item is SubmissionListItem => item !== null);

    return {
      items,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async findByReference(reference: string): Promise<AdminSubmissionDetail | null> {
    const normalized = normalizePublicReference(reference);
    if (!normalized) return null;

    const row = await this.db
      .prepare("SELECT * FROM submissions WHERE public_reference = ?")
      .bind(normalized)
      .first<Record<string, unknown>>();
    if (!row) return null;

    const id = row.id;
    let internal: DeliveryState | null = null;
    let acknowledgement: DeliveryState | null = null;
    if (typeof id === "string") {
      const deliveries = await this.db
        .prepare("SELECT delivery_kind, state FROM email_deliveries WHERE submission_id = ?")
        .bind(id)
        .all<{ delivery_kind: string; state: string }>();
      for (const delivery of deliveries.results) {
        if (delivery.delivery_kind === "internal") internal = delivery.state as DeliveryState;
        if (delivery.delivery_kind === "acknowledgement") acknowledgement = delivery.state as DeliveryState;
      }
    }

    return toDetail(row, { internal, acknowledgement });
  }

  async updateStatus(options: { reference: string; status: AdminSubmissionStatus; administratorEmail: string; updatedAt: string }): Promise<boolean> {
    const normalized = normalizePublicReference(options.reference);
    if (!normalized) return false;

    const result = await this.db
      .prepare("UPDATE submissions SET status = ?, updated_at = ?, status_updated_by = ? WHERE public_reference = ?")
      .bind(options.status, options.updatedAt, options.administratorEmail, normalized)
      .run();

    return result.meta.changes > 0;
  }
}
