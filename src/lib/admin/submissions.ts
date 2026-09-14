import type { DeliveryState } from "../submissions/repository";
import type { GuestTopic, IdentityPreference, PublicationPermission, StorySubmissionType, SubmissionKind, SubmissionLifecycleStatus } from "../submissions/types";

export const SUBMISSION_STATUSES: readonly SubmissionLifecycleStatus[] = [
  "new",
  "reviewing",
  "contacted",
  "shortlisted",
  "scheduled",
  "declined",
  "used",
  "archived",
];

export type AdminSubmissionStatus = SubmissionLifecycleStatus;

export const SUBMISSION_FILTERS = [
  "all",
  "new",
  "stories",
  "questions",
  "topics",
  "guests",
  "reviewing",
  "contacted",
  "shortlisted",
  "scheduled",
  "declined",
  "used",
  "archived",
] as const;

export type AdminSubmissionFilter = (typeof SUBMISSION_FILTERS)[number];

const FILTER_SET = new Set<string>(SUBMISSION_FILTERS);
const STATUS_SET = new Set<string>(SUBMISSION_STATUSES);
const REFERENCE_PATTERN = /^SWM-[SG]-[A-Z0-9]{6}$/;
const MAX_PAGE = 100_000;

export function parseSubmissionFilter(value: unknown): AdminSubmissionFilter {
  if (typeof value === "string" && FILTER_SET.has(value)) {
    return value as AdminSubmissionFilter;
  }
  return "all";
}

export function parsePage(value: unknown): number {
  if (typeof value !== "string" && typeof value !== "number") return 1;
  const parsed = typeof value === "number" ? value : Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_PAGE) return 1;
  return parsed;
}

export type ParsedSubmissionStatus =
  | { valid: true; status: AdminSubmissionStatus }
  | { valid: false };

export function parseSubmissionStatus(value: unknown): ParsedSubmissionStatus {
  if (typeof value === "string" && STATUS_SET.has(value)) {
    return { valid: true, status: value as AdminSubmissionStatus };
  }
  return { valid: false };
}

export function normalizePublicReference(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  return REFERENCE_PATTERN.test(normalized) ? normalized : null;
}

function parseStringArray(value: unknown): string[] {
  if (typeof value !== "string" || value.trim() === "") return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((item): item is string => typeof item === "string");
}

export { parseStringArray };

export interface SubmissionListItem {
  publicReference: string;
  kind: SubmissionKind;
  submissionType: StorySubmissionType | null;
  createdAt: string;
  status: AdminSubmissionStatus;
  displayIdentity: string;
  publicationPermission: PublicationPermission | null;
  contactPermission: boolean | null;
  excerpt: string;
}

export interface SubmissionPage {
  items: SubmissionListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface DeliverySummary {
  internal: DeliveryState | null;
  acknowledgement: DeliveryState | null;
}

export interface StoryAdminSubmissionDetail {
  kind: "story";
  publicReference: string;
  createdAt: string;
  updatedAt: string | null;
  status: AdminSubmissionStatus;
  statusUpdatedBy: string | null;
  submissionType: StorySubmissionType;
  identityPreference: IdentityPreference;
  name: string | null;
  pseudonym: string | null;
  email: string | null;
  content: string;
  publicationPermission: PublicationPermission;
  contactPermission: boolean;
  delivery: DeliverySummary;
}

export interface GuestAdminSubmissionDetail {
  kind: "guest";
  publicReference: string;
  createdAt: string;
  updatedAt: string | null;
  status: AdminSubmissionStatus;
  statusUpdatedBy: string | null;
  name: string;
  preferredName: string | null;
  email: string;
  timezone: string | null;
  about: string;
  talkAbout: string;
  whySwm: string;
  website: string | null;
  socialLinks: string[];
  previousAppearances: string | null;
  topics: GuestTopic[];
  anythingElse: string | null;
  recordingAcknowledged: boolean;
  delivery: DeliverySummary;
}

export type AdminSubmissionDetail = StoryAdminSubmissionDetail | GuestAdminSubmissionDetail;
