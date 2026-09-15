import { defineMiddleware } from "astro:middleware";
import { AccessDeniedError, verifyAccessRequest } from "./lib/admin/access";

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  if (!isAdminRoute) {
    return next();
  }

  const { env } = await import("cloudflare:workers");

  try {
    const identity = await verifyAccessRequest(context.request, {
      teamDomain: env.CLOUDFLARE_ACCESS_TEAM_DOMAIN ?? "",
      audience: env.CLOUDFLARE_ACCESS_AUD ?? "",
    });
    context.locals.adminIdentity = identity;
  } catch (error) {
    if (error instanceof AccessDeniedError) {
      return new Response("Forbidden", { status: 403 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  const response = await next();
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
});
