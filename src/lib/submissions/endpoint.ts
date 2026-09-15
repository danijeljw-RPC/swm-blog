import { env } from "cloudflare:workers";
import { CloudflareSubmissionNotifier } from "./notifications";
import { readJsonRequest, json } from "./http";
import { D1SubmissionRepository, hashClientAddress } from "./repository";
import { createSubmissionService } from "./service";
import { verifyTurnstile } from "./turnstile";

export async function handleSubmission(request: Request, kind: "story" | "guest"): Promise<Response> {
  const parsed = await readJsonRequest(request); if (!parsed.ok) return json(parsed.status, { success: false, message: parsed.message });
  const hostname = new URL(request.url).hostname; const address = request.headers.get("cf-connecting-ip") ?? "local";
  try {
    const required = (value: unknown, name: string): string => { if (typeof value !== "string" || !value.trim() || value.startsWith("REPLACE_WITH_")) throw new Error(`missing_${name}`); return value; };
    const rateSecret = required(env.SUBMISSION_RATE_LIMIT_SECRET, "rate_secret"); required(env.TURNSTILE_SECRET_KEY, "turnstile_secret"); required(env.SUBMISSIONS_FROM_EMAIL, "from_email"); required(env.SUBMISSIONS_NOTIFICATION_EMAIL, "notification_email"); required(env.SUBMISSIONS_ALLOWED_HOSTNAMES, "allowed_hostnames");
    if (!env.SUBMISSIONS_DB || !env.SUBMISSIONS_EMAIL) throw new Error("missing_binding");
    const clientKey = await hashClientAddress(address, rateSecret);
    const repository = new D1SubmissionRepository(env.SUBMISSIONS_DB);
    const notifier = new CloudflareSubmissionNotifier(env.SUBMISSIONS_EMAIL, env.SUBMISSIONS_FROM_EMAIL, env.SUBMISSIONS_NOTIFICATION_EMAIL);
    const service = createSubmissionService({ repository, notifier, verify: (token, action) => verifyTurnstile(token, { secret: env.TURNSTILE_SECRET_KEY, action, allowedHostnames: env.SUBMISSIONS_ALLOWED_HOSTNAMES.split(",").map((item) => item.trim()), remoteIp: address, testMode: env.TURNSTILE_TEST_MODE === "true" }) });
    const context = { clientAddress: clientKey, hostname, userAgent: request.headers.get("user-agent") };
    const result = kind === "story" ? await service.submitStory(parsed.value, context) : await service.submitGuest(parsed.value, context);
    if (result.kind === "accepted") return json(201, { success: true, reference: result.reference });
    if (result.kind === "invalid") return json(400, { success: false, message: "Please check the highlighted fields.", errors: result.errors });
    if (result.kind === "rate_limited") return json(429, { success: false, message: "You've sent several submissions recently. Please try again later." });
    if (result.kind === "spam" || result.kind === "verification_failed") return json(403, { success: false, message: "We couldn't verify this submission. Please try again." });
    return json(500, { success: false, message: "We couldn't save this just now. Please try again." });
  } catch (error) { console.error(JSON.stringify({ event: "submission_failed", kind, error: error instanceof Error ? error.name : "unknown" })); return json(500, { success: false, message: "We couldn't save this just now. Please try again." }); }
}
