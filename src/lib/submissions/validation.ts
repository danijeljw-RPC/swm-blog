import type { GuestSubmissionInput, GuestTopic, IdentityPreference, PublicationPermission, StorySubmissionInput, StorySubmissionType, ValidationResult } from "./types";

const STORY_TYPES = ["story", "question", "topic", "other"] as const;
const IDENTITIES = ["name", "pseudonym", "anonymous"] as const;
const PERMISSIONS = ["read", "paraphrase", "private"] as const;
export const GUEST_TOPICS = ["consciousness", "spirituality", "psychic-experiences", "mediumship", "energy", "astrology", "tarot", "reincarnation", "afterlife", "ufo-uap", "extraterrestrial-life", "higher-dimensional-experiences", "synchronicity", "personal-transformation", "other"] as const;

function object(value: unknown): Record<string, unknown> | null { return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null; }
function text(value: unknown): string { return typeof value === "string" ? value.trim() : ""; }
function optional(value: unknown): string | null { return text(value) || null; }
function email(value: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254; }
function url(value: string): boolean { try { const parsed = new URL(value); return (parsed.protocol === "http:" || parsed.protocol === "https:") && value.length <= 2_048; } catch { return false; } }
function required(errors: Record<string, string>, key: string, value: string, max: number): void { if (!value) errors[key] = "This field is required."; else if (value.length > max) errors[key] = `Keep this under ${max.toLocaleString()} characters.`; }
function common(record: Record<string, unknown>, errors: Record<string, string>) {
  const turnstileToken = text(record.turnstileToken);
  const websiteCompany = text(record.websiteCompany);
  if (!turnstileToken || turnstileToken.length > 2_048) errors.turnstileToken = "Please complete the verification.";
  if (websiteCompany.length > 200) errors.websiteCompany = "Invalid submission.";
  return { turnstileToken, websiteCompany };
}

export function validateStorySubmission(value: unknown): ValidationResult<StorySubmissionInput> {
  const record = object(value); if (!record) return { success: false, errors: { form: "Send a valid submission." } };
  const errors: Record<string, string> = {}; const base = common(record, errors);
  const submissionType = text(record.submissionType); const identityPreference = text(record.identityPreference); const publicationPermission = text(record.publicationPermission);
  const name = optional(record.name); const pseudonym = optional(record.pseudonym); const emailValue = optional(record.email); const content = text(record.content);
  if (!STORY_TYPES.includes(submissionType as StorySubmissionType)) errors.submissionType = "Choose what you would like to share.";
  if (!IDENTITIES.includes(identityPreference as IdentityPreference)) errors.identityPreference = "Choose how we should identify you.";
  if (identityPreference === "name" && !name) errors.name = "Tell us the name you would like us to use.";
  if (identityPreference === "pseudonym" && !pseudonym) errors.pseudonym = "Tell us the pseudonym you would like us to use.";
  if ((name?.length ?? 0) > 120) errors.name = "Keep this under 120 characters.";
  if ((pseudonym?.length ?? 0) > 120) errors.pseudonym = "Keep this under 120 characters.";
  if (emailValue && !email(emailValue)) errors.email = "Enter a valid email address.";
  required(errors, "content", content, 20_000);
  if (!PERMISSIONS.includes(publicationPermission as PublicationPermission)) errors.publicationPermission = "Choose how DJ and Warren may use this submission.";
  if (typeof record.contactPermission !== "boolean") errors.contactPermission = "Choose whether DJ and Warren may contact you.";
  if (record.contactPermission === true && !emailValue) errors.contactPermission = "Add an email address if we may contact you.";
  if (Object.keys(errors).length) return { success: false, errors };
  return { success: true, data: { ...base, submissionType: submissionType as StorySubmissionType, identityPreference: identityPreference as IdentityPreference, name: identityPreference === "name" ? name : null, pseudonym: identityPreference === "pseudonym" ? pseudonym : null, email: emailValue, content, publicationPermission: publicationPermission as PublicationPermission, contactPermission: record.contactPermission as boolean } };
}

export function validateGuestSubmission(value: unknown): ValidationResult<GuestSubmissionInput> {
  const record = object(value); if (!record) return { success: false, errors: { form: "Send a valid submission." } };
  const errors: Record<string, string> = {}; const base = common(record, errors);
  const name = text(record.name); const preferredName = optional(record.preferredName); const emailValue = text(record.email); const timezone = optional(record.timezone);
  const about = text(record.about); const talkAbout = text(record.talkAbout); const whySwm = text(record.whySwm); const website = optional(record.website);
  const previousAppearances = optional(record.previousAppearances); const anythingElse = optional(record.anythingElse);
  required(errors, "name", name, 120); required(errors, "email", emailValue, 254); if (emailValue && !email(emailValue)) errors.email = "Enter a valid email address.";
  required(errors, "about", about, 10_000); required(errors, "talkAbout", talkAbout, 10_000); required(errors, "whySwm", whySwm, 5_000);
  if ((preferredName?.length ?? 0) > 120) errors.preferredName = "Keep this under 120 characters.";
  if ((timezone?.length ?? 0) > 160) errors.timezone = "Keep this under 160 characters.";
  if (website && !url(website)) errors.website = "Enter a complete http or https URL.";
  const socialLinks = typeof record.socialLinks === "string" ? record.socialLinks.split(/\r?\n/).map(text).filter(Boolean) : [];
  if (socialLinks.length > 10 || socialLinks.some((link) => !url(link))) errors.socialLinks = "Enter up to 10 complete http or https URLs, one per line.";
  const topics = Array.isArray(record.topics) ? record.topics : [];
  if (topics.length > GUEST_TOPICS.length || topics.some((topic) => typeof topic !== "string" || !GUEST_TOPICS.includes(topic as GuestTopic))) errors.topics = "Choose only the available topics.";
  if ((previousAppearances?.length ?? 0) > 5_000) errors.previousAppearances = "Keep this under 5,000 characters.";
  if ((anythingElse?.length ?? 0) > 5_000) errors.anythingElse = "Keep this under 5,000 characters.";
  if (record.recordingAcknowledged !== true) errors.recordingAcknowledged = "Please acknowledge that an invited conversation will be recorded.";
  if (Object.keys(errors).length) return { success: false, errors };
  return { success: true, data: { ...base, name, preferredName, email: emailValue, timezone, about, talkAbout, whySwm, website, socialLinks, previousAppearances, topics: topics as GuestTopic[], anythingElse, recordingAcknowledged: true } };
}
