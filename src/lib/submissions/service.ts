import type { SubmissionNotifier } from "./notifications";
import type { SubmissionRepository } from "./repository";
import { createPublicReference, createSubmissionIdentity } from "./references";
import { PublicReferenceCollisionError } from "./repository";
import type { GuestSubmissionInput, StoredSubmission, StorySubmissionInput, ValidationResult } from "./types";
import { validateGuestSubmission, validateStorySubmission } from "./validation";

type Verify = (token: string, action: string, hostname: string) => Promise<{ success: boolean }>;
type Result = { kind: "accepted"; reference: string } | { kind: "invalid"; errors: Record<string, string> } | { kind: "spam" | "rate_limited" | "verification_failed" | "unavailable" };
export function createSubmissionService(deps: { repository: SubmissionRepository; notifier: SubmissionNotifier; verify: Verify; now?: () => Date }) {
  async function submit<T extends StorySubmissionInput | GuestSubmissionInput>(kind: "story" | "guest", validation: ValidationResult<T>, context: { clientAddress: string; hostname: string; userAgent?: string | null }): Promise<Result> {
    if (!validation.success) return { kind: "invalid", errors: validation.errors };
    if (validation.data.websiteCompany) return { kind: "spam" };
    if (!await deps.repository.consumeRateLimit(context.clientAddress, deps.now?.())) return { kind: "rate_limited" };
    if (!(await deps.verify(validation.data.turnstileToken, kind === "story" ? "share-story" : "be-a-guest", context.hostname)).success) return { kind: "verification_failed" };
    const identity = createSubmissionIdentity(kind); const stored: StoredSubmission = { ...identity, kind, createdAt: (deps.now?.() ?? new Date()).toISOString(), status: "new", metadata: { hostname: context.hostname, userAgent: context.userAgent?.slice(0, 300) ?? null }, ...(kind === "story" ? { story: validation.data as StorySubmissionInput } : { guest: validation.data as GuestSubmissionInput }) };
    let persisted = false; for (let attempt = 0; attempt < 3 && !persisted; attempt++) { try { await deps.repository.create(stored); persisted = true; } catch (error) { if (error instanceof PublicReferenceCollisionError && attempt < 2) stored.publicReference = createPublicReference(kind); else return { kind: "unavailable" }; } }
    const mark = async (delivery: "internal" | "acknowledgement", state: "sent" | "failed") => { try { await deps.repository.markDelivery(stored.id, delivery, state, state === "failed" ? "delivery_error" : undefined); } catch { /* Persistence already succeeded; tracking cannot make the client resubmit. */ } };
    try { await deps.notifier.notifyNewSubmission(stored); await mark("internal", "sent"); } catch { await mark("internal", "failed"); }
    if (stored.story?.email || stored.guest?.email) { try { await deps.notifier.acknowledgeSubmission(stored); await mark("acknowledgement", "sent"); } catch { await mark("acknowledgement", "failed"); } }
    return { kind: "accepted", reference: stored.publicReference };
  }
  const honeypot = (value: unknown) => value !== null && typeof value === "object" && !Array.isArray(value) && typeof (value as Record<string, unknown>).websiteCompany === "string" && (value as Record<string, unknown>).websiteCompany !== "";
  return { submitStory: (value: unknown, context: { clientAddress: string; hostname: string; userAgent?: string | null }) => honeypot(value) ? Promise.resolve<Result>({ kind: "spam" }) : submit("story", validateStorySubmission(value), context), submitGuest: (value: unknown, context: { clientAddress: string; hostname: string; userAgent?: string | null }) => honeypot(value) ? Promise.resolve<Result>({ kind: "spam" }) : submit("guest", validateGuestSubmission(value), context) };
}
