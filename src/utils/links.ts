export interface PlatformConfig {
  label: string;
  url: string;
}

export interface ConfiguredPlatform extends PlatformConfig {
  id: string;
}

export function getConfiguredPlatforms(
  entries: Record<string, PlatformConfig>,
): ConfiguredPlatform[] {
  return Object.entries(entries).flatMap(([id, platform]) => {
    const url = platform.url.trim();
    return url ? [{ id, label: platform.label, url }] : [];
  });
}

export function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}
