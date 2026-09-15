const rootRelativeMediaPath = /^\/(?!\/)/;

export function isMediaUrl(value: unknown): value is string {
  return typeof value === "string" && (value.startsWith("https://") || rootRelativeMediaPath.test(value));
}

export function resolveMediaUrl(value: string, mediaBaseUrl: string): string {
  if (value.startsWith("https://")) {
    new URL(value);
    return value;
  }

  if (rootRelativeMediaPath.test(value)) {
    const baseUrl = new URL(mediaBaseUrl);
    return `${baseUrl.href.replace(/\/+$/, "")}${value}`;
  }

  throw new Error("Media URL must be a root-relative path or an HTTPS URL");
}
