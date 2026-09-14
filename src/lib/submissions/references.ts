import type { SubmissionKind } from "./types";
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export function createPublicReference(kind: SubmissionKind): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  const code = Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join("");
  return `SWM-${kind === "story" ? "S" : "G"}-${code}`;
}
export function createSubmissionIdentity(kind: SubmissionKind): { id: string; publicReference: string } { return { id: crypto.randomUUID(), publicReference: createPublicReference(kind) }; }
