import type { AdminIdentity } from "./access";
import { normalizePublicReference, parseSubmissionStatus } from "./submissions";

export interface StatusUpdateRepository {
  updateStatus(input: { reference: string; status: string; administratorEmail: string; updatedAt: string }): Promise<boolean>;
}

const MAX_BODY_BYTES = 4 * 1024;

function privateHeaders(): Headers {
  const headers = new Headers();
  headers.set("Cache-Control", "private, no-store");
  headers.set("Referrer-Policy", "same-origin");
  return headers;
}

function textResponse(status: number, message: string): Response {
  return new Response(message, { status, headers: privateHeaders() });
}

export async function handleStatusUpdate(
  request: Request,
  reference: string,
  identity: AdminIdentity,
  repository: StatusUpdateRepository,
  expectedOrigin: string,
  now: () => Date = () => new Date(),
): Promise<Response> {
  const contentType = request.headers.get("Content-Type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/x-www-form-urlencoded")) {
    return textResponse(400, "Unsupported content type");
  }

  const contentLengthHeader = request.headers.get("Content-Length");
  if (contentLengthHeader) {
    const contentLength = Number.parseInt(contentLengthHeader, 10);
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
      return textResponse(400, "Request body too large");
    }
  }

  const bodyText = await request.text();
  if (bodyText.length > MAX_BODY_BYTES) {
    return textResponse(400, "Request body too large");
  }

  const originHeader = request.headers.get("Origin");
  if (!originHeader) {
    return textResponse(403, "Missing Origin header");
  }
  let originValue: string;
  try {
    originValue = new URL(originHeader).origin;
  } catch {
    return textResponse(403, "Invalid Origin header");
  }
  if (originValue !== expectedOrigin) {
    return textResponse(403, "Origin mismatch");
  }

  const normalizedReference = normalizePublicReference(reference);
  if (!normalizedReference) {
    return textResponse(400, "Invalid submission reference");
  }

  const params = new URLSearchParams(bodyText);
  const statusValues = params.getAll("status");
  if (statusValues.length !== 1) {
    return textResponse(400, "Missing or duplicate status field");
  }

  const parsedStatus = parseSubmissionStatus(statusValues[0]);
  if (!parsedStatus.valid) {
    return textResponse(400, "Unknown status value");
  }

  let updated: boolean;
  try {
    updated = await repository.updateStatus({
      reference: normalizedReference,
      status: parsedStatus.status,
      administratorEmail: identity.email,
      updatedAt: now().toISOString(),
    });
  } catch {
    return textResponse(500, "Unable to update submission status");
  }

  if (!updated) {
    return textResponse(404, "Submission not found");
  }

  const headers = privateHeaders();
  headers.set("Location", `/admin/submissions/${normalizedReference}/?updated=1`);
  return new Response(null, { status: 303, headers });
}
