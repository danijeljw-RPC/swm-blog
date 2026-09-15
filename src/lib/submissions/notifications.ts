import type { PublicationPermission, StoredSubmission } from "./types";

export interface EmailMessageContent { subject: string; text: string; html: string; }
export interface SendEmailBinding { send(message: { from: string; to: string; subject: string; text: string; html: string }): Promise<unknown>; }
export interface SubmissionNotifier { notifyNewSubmission(submission: StoredSubmission): Promise<void>; acknowledgeSubmission(submission: StoredSubmission): Promise<void>; }

export function escapeHtml(value: string): string { return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;"); }
function message(subject: string, text: string): EmailMessageContent { return { subject, text, html: `<div style="font-family:Arial,sans-serif;line-height:1.6;white-space:pre-wrap">${escapeHtml(text)}</div>` }; }

export function renderAcknowledgement(input: { kind: "story"; publicReference: string; publicationPermission: PublicationPermission } | { kind: "guest"; publicReference: string }): EmailMessageContent {
  if (input.kind === "guest") return message("We received your guest submission — Sisters with Mirrors", `Thanks for getting in touch.\n\nDJ and Warren have received your guest submission.\n\nYour reference is: ${input.publicReference}\n\nWe'll take a look at what you'd like to discuss and will contact you if we'd like to organise a conversation.\n\nSisters with Mirrors`);
  const permission = input.publicationPermission === "private" ? "You've asked us to keep it between you, DJ and Warren." : "If you've given us permission to discuss it on Sisters with Mirrors, we may include it in a future conversation.";
  return message("We received your story — Sisters with Mirrors", `Thanks for sharing this with us.\n\nDJ and Warren have received your submission.\n\nYour reference is: ${input.publicReference}\n\n${permission}\n\nThanks for stepping through the mirror with us.\n\nSisters with Mirrors`);
}

export function renderInternalNotification(input: { publicReference: string; kind: string; createdAt: string; displayIdentity: string; email: string | null; permission: string; content: string; details: [string, string | null][] }): EmailMessageContent {
  const lines = [`Submission ID: ${input.publicReference}`, `Kind: ${input.kind}`, `Date: ${input.createdAt}`, `Identity: ${input.displayIdentity}`, `Email: ${input.email ?? "Not supplied"}`, `Permission: ${input.permission}`, ...input.details.filter(([, value]) => value).map(([label, value]) => `${label}: ${value}`), "", input.content];
  return message(`New ${input.kind} submission — ${input.publicReference}`, lines.join("\n"));
}

export class CloudflareSubmissionNotifier implements SubmissionNotifier {
  constructor(private binding: SendEmailBinding | undefined, private from: string, private team: string) {}
  async notifyNewSubmission(submission: StoredSubmission): Promise<void> {
    if (!this.binding) throw new Error("email_binding_missing");
    const story = submission.story; const guest = submission.guest;
    const rendered = renderInternalNotification({ publicReference: submission.publicReference, kind: submission.kind, createdAt: submission.createdAt, displayIdentity: story ? (story.identityPreference === "anonymous" ? "Anonymous" : story.name ?? story.pseudonym ?? "Anonymous") : guest?.preferredName ?? guest?.name ?? "Unknown", email: story?.email ?? guest?.email ?? null, permission: story?.publicationPermission ?? "guest request", content: story?.content ?? guest?.talkAbout ?? "", details: guest ? [["Location / timezone", guest.timezone], ["Website", guest.website], ["Social links", guest.socialLinks.join("\n")], ["Previous appearances", guest.previousAppearances], ["About", guest.about], ["Why Sisters with Mirrors", guest.whySwm], ["Topics", guest.topics.join(", ")], ["Anything else", guest.anythingElse]] : [["Submission type", story?.submissionType ?? null]] });
    await this.binding.send({ from: this.from, to: this.team, ...rendered });
  }
  async acknowledgeSubmission(submission: StoredSubmission): Promise<void> {
    const email = submission.story?.email ?? submission.guest?.email; if (!email || !this.binding) return;
    const rendered = submission.kind === "story" ? renderAcknowledgement({ kind: "story", publicReference: submission.publicReference, publicationPermission: submission.story!.publicationPermission }) : renderAcknowledgement({ kind: "guest", publicReference: submission.publicReference });
    await this.binding.send({ from: this.from, to: email, ...rendered });
  }
}
