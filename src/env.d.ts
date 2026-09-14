/// <reference types="astro/client" />

interface Window {
  turnstile?: { reset(widgetId?: string): void };
}

declare namespace Cloudflare {
  interface Env {
    TURNSTILE_SECRET_KEY: string;
    SUBMISSION_RATE_LIMIT_SECRET: string;
    TURNSTILE_TEST_MODE?: string;
  }
}
