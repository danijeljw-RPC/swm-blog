export const site = {
  name: "Sisters with Mirrors",
  tagline: "Look Into The Mirror",
  description: "Weekly podcast and videocast articles from Sisters with Mirrors.",
  url: import.meta.env.PUBLIC_SITE_URL || (import.meta.env.DEV ? "http://localhost:4321" : "https://sisterswithmirrors.com"),
  mediaUrl: import.meta.env.PUBLIC_MEDIA_URL || "https://media.sisterswithmirrors.com",
  language: "en-AU",
  timezone: "Australia/Adelaide",
  rssPath: "/rss.xml",
} as const;
