// Production domain - the published app URL
const PRODUCTION_URL = "https://likearocket-calendario.lovable.app";

export function getPublicBaseUrl(): string {
  const host = window.location.host;

  // If we're on the editor/preview domain (*.lovableproject.com), use production URL
  if (host.endsWith(".lovableproject.com")) {
    return PRODUCTION_URL;
  }

  // Otherwise use current origin (already on production or custom domain)
  return window.location.origin;
}
