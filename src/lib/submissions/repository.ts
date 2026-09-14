import type { StoredSubmission } from "./types";
export type DeliveryKind = "internal" | "acknowledgement";
export type DeliveryState = "pending" | "sent" | "failed";
export interface SubmissionRepository { consumeRateLimit(clientKey: string, now?: Date): Promise<boolean>; create(submission: StoredSubmission): Promise<void>; markDelivery(id: string, kind: DeliveryKind, state: DeliveryState, error?: string): Promise<void>; }
export class PublicReferenceCollisionError extends Error {}

export async function hashClientAddress(address: string, secret: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${secret}\0${address}`); const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export class D1SubmissionRepository implements SubmissionRepository {
  constructor(private db: D1Database) {}
  async consumeRateLimit(clientKey: string, now = new Date()): Promise<boolean> {
    const windowStart = Math.floor(now.getTime() / 3_600_000) * 3_600;
    const row = await this.db.prepare("INSERT INTO submission_rate_limits (client_key, window_start, attempts) VALUES (?, ?, 1) ON CONFLICT(client_key, window_start) DO UPDATE SET attempts = attempts + 1 RETURNING attempts").bind(clientKey, windowStart).first<{ attempts: number }>();
    return Boolean(row && row.attempts <= 5);
  }
  async create(submission: StoredSubmission): Promise<void> {
    const story = submission.story; const guest = submission.guest; const deliveries: DeliveryKind[] = ["internal", ...((story?.email ?? guest?.email) ? ["acknowledgement" as const] : [])];
    const insert = this.db.prepare(`INSERT INTO submissions (id, public_reference, kind, created_at, status, name, pseudonym, email, timezone, submission_type, identity_preference, publication_permission, contact_permission, content, about, why_swm, website, social_links, previous_appearances, topics, anything_else, recording_acknowledged, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(submission.id, submission.publicReference, submission.kind, submission.createdAt, submission.status, story?.name ?? guest?.name ?? null, story?.pseudonym ?? null, story?.email ?? guest?.email ?? null, guest?.timezone ?? null, story?.submissionType ?? null, story?.identityPreference ?? null, story?.publicationPermission ?? null, story ? Number(story.contactPermission) : null, story?.content ?? guest?.talkAbout ?? "", guest?.about ?? null, guest?.whySwm ?? null, guest?.website ?? null, JSON.stringify(guest?.socialLinks ?? []), guest?.previousAppearances ?? null, JSON.stringify(guest?.topics ?? []), guest?.anythingElse ?? null, guest ? 1 : null, JSON.stringify(submission.metadata ?? {}));
    try { await this.db.batch([insert, ...deliveries.map((kind) => this.db.prepare("INSERT INTO email_deliveries (submission_id, delivery_kind, state, updated_at) VALUES (?, ?, 'pending', ?)").bind(submission.id, kind, submission.createdAt))]); }
    catch (error) { if (error instanceof Error && /public_reference|submissions\.public_reference/i.test(error.message)) throw new PublicReferenceCollisionError(); throw error; }
  }
  async markDelivery(id: string, kind: DeliveryKind, state: DeliveryState, error?: string): Promise<void> {
    await this.db.prepare("UPDATE email_deliveries SET state = ?, attempts = attempts + 1, updated_at = ?, last_error_category = ? WHERE submission_id = ? AND delivery_kind = ?").bind(state, new Date().toISOString(), error ?? null, id, kind).run();
  }
}
