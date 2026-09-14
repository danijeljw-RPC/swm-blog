/// <reference types="astro/client" />

interface Window {
  turnstile?: { reset(widgetId?: string): void };
}

declare namespace App {
  interface Locals {
    adminIdentity?: import("./lib/admin/access").AdminIdentity;
  }
}

declare namespace Cloudflare {
  interface Env {
    TURNSTILE_SECRET_KEY: string;
    SUBMISSION_RATE_LIMIT_SECRET: string;
    TURNSTILE_TEST_MODE?: string;
    CLOUDFLARE_ACCESS_TEAM_DOMAIN?: string;
    CLOUDFLARE_ACCESS_AUD?: string;
  }
}
