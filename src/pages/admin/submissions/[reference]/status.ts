export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { handleStatusUpdate } from "../../../../lib/admin/mutation";
import { D1AdminSubmissionRepository } from "../../../../lib/admin/repository";

export const POST: APIRoute = async ({ request, params, locals }) => {
  const identity = locals.adminIdentity;
  if (!identity) {
    return new Response("Forbidden", { status: 403 });
  }

  const reference = params.reference;
  if (typeof reference !== "string") {
    return new Response("Invalid submission reference", { status: 400 });
  }

  const repository = new D1AdminSubmissionRepository(env.SUBMISSIONS_DB);
  const expectedOrigin = new URL(env.PUBLIC_SITE_URL).origin;

  return handleStatusUpdate(request, reference, identity, repository, expectedOrigin);
};
