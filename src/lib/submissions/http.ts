export const MAX_REQUEST_BYTES = 32 * 1024;
export async function readJsonRequest(request: Request): Promise<{ ok: true; value: unknown } | { ok: false; status: 400 | 413 | 415; message: string }> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return { ok: false, status: 415, message: "Send this form as JSON." };
  const declared = Number(request.headers.get("content-length") ?? 0); if (declared > MAX_REQUEST_BYTES) return { ok: false, status: 413, message: "This submission is too large." };
  if (!request.body) return { ok: false, status: 400, message: "We couldn't read that submission." };
  const reader = request.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
  while (true) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > MAX_REQUEST_BYTES) { await reader.cancel(); return { ok: false, status: 413, message: "This submission is too large." }; } chunks.push(value); }
  const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  let text: string; try { text = new TextDecoder("utf-8", { fatal: true }).decode(bytes); } catch { return { ok: false, status: 400, message: "We couldn't read that submission." }; }
  try { return { ok: true, value: JSON.parse(text) }; } catch { return { ok: false, status: 400, message: "We couldn't read that submission." }; }
}
export function json(status: number, body: unknown): Response { return Response.json(body, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } }); }
