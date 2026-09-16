const GEO_CACHE_KEY = "fk_geo_country";

function parseCloudflareTrace(text: string): string | null {
  const match = text.match(/^loc=([A-Z]{2})$/m);
  return match ? match[1] : null;
}

async function lookupViaCloudflare(): Promise<string | null> {
  const res = await fetch("https://www.cloudflare.com/cdn-cgi/trace");
  if (!res.ok) throw new Error("cloudflare trace failed");
  return parseCloudflareTrace(await res.text());
}

async function lookupViaIpwhois(): Promise<string | null> {
  const res = await fetch("https://ipwho.is/");
  if (!res.ok) throw new Error("ipwho.is lookup failed");
  const data = await res.json();
  return typeof data.country_code === "string" && data.country_code.length === 2
    ? data.country_code.toUpperCase()
    : null;
}

// Best-effort client-side IP geolocation. Returns the visitor's ISO country
// code, or null if it can't be determined (network failure, blocked, etc.)
// — callers should treat null as "unknown" rather than "unsupported".
//
// Uses Cloudflare's free, unlimited edge-trace endpoint first (works for any
// site since it's answered by whichever Cloudflare edge the request hits,
// not tied to our own domain), falling back to ipwho.is if that fails —
// avoids relying on a low free-tier rate limit from a single provider.
export async function detectVisitorCountry(): Promise<string | null> {
  if (typeof window !== "undefined") {
    const cached = window.sessionStorage.getItem(GEO_CACHE_KEY);
    if (cached) return cached === "unknown" ? null : cached;
  }

  let code: string | null = null;
  try {
    code = await lookupViaCloudflare();
  } catch {
    try {
      code = await lookupViaIpwhois();
    } catch {
      code = null;
    }
  }

  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(GEO_CACHE_KEY, code ?? "unknown");
  }
  return code;
}
