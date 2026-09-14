export type SubmissionKind = "story" | "guest";
export type StorySubmissionType = "story" | "question" | "topic" | "other";
export type IdentityPreference = "name" | "pseudonym" | "anonymous";
export type PublicationPermission = "read" | "paraphrase" | "private";
export type GuestTopic = "consciousness" | "spirituality" | "psychic-experiences" | "mediumship" | "energy" | "astrology" | "tarot" | "reincarnation" | "afterlife" | "ufo-uap" | "extraterrestrial-life" | "higher-dimensional-experiences" | "synchronicity" | "personal-transformation" | "other";

export interface CommonSubmissionInput { turnstileToken: string; websiteCompany: string; }
export interface StorySubmissionInput extends CommonSubmissionInput {
  submissionType: StorySubmissionType; identityPreference: IdentityPreference; name: string | null; pseudonym: string | null;
  email: string | null; content: string; publicationPermission: PublicationPermission; contactPermission: boolean;
}
export interface GuestSubmissionInput extends CommonSubmissionInput {
  name: string; preferredName: string | null; email: string; timezone: string | null; about: string; talkAbout: string; whySwm: string;
  website: string | null; socialLinks: string[]; previousAppearances: string | null; topics: GuestTopic[]; anythingElse: string | null;
  recordingAcknowledged: true;
}
export type FieldErrors = Record<string, string>;
export type ValidationResult<T> = { success: true; data: T } | { success: false; errors: FieldErrors };

export interface StoredSubmission {
  id: string; publicReference: string; kind: SubmissionKind; createdAt: string; status: "new";
  metadata?: { hostname: string; userAgent: string | null };
  story?: StorySubmissionInput; guest?: GuestSubmissionInput;
}
