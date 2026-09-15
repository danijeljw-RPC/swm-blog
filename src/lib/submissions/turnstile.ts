export interface TurnstileConfig { secret: string; action: string; allowedHostnames: readonly string[]; remoteIp?: string; testMode?: boolean; }
export type TurnstileResult = { success: true } | { success: false; reason: "invalid" | "unavailable" };
const CLOUDFLARE_ALWAYS_PASS_TEST_SECRET = "1x0000000000000000000000000000000AA";
export async function verifyTurnstile(token: string, config: TurnstileConfig, fetcher: typeof fetch = fetch): Promise<TurnstileResult> {
  try {
    const body = new FormData(); body.set("secret", config.secret); body.set("response", token); if (config.remoteIp) body.set("remoteip", config.remoteIp);
    const response = await fetcher("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
    if (!response.ok) return { success: false, reason: "unavailable" };
    const result = await response.json() as { success?: boolean; action?: string; hostname?: string };
    const isCloudflareTest = config.testMode === true && config.secret === CLOUDFLARE_ALWAYS_PASS_TEST_SECRET && result.hostname === "example.com";
    const actionMatches = result.action === config.action || isCloudflareTest;
    const hostnameMatches = typeof result.hostname === "string" && (config.allowedHostnames.includes(result.hostname) || isCloudflareTest);
    return result.success === true && actionMatches && hostnameMatches ? { success: true } : { success: false, reason: "invalid" };
  } catch { return { success: false, reason: "unavailable" }; }
}
