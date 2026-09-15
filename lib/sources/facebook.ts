import "server-only";

// facebook.com, www.facebook.com, web.facebook.com, m.facebook.com (and any
// other *.facebook.com / *.fb.com subdomain) are all the same platform for
// our purposes — normalize them to one check instead of matching each host
// variant separately.
const FACEBOOK_HOST_SUFFIXES = ["facebook.com", "fb.com"];

export function isFacebookHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return FACEBOOK_HOST_SUFFIXES.some(
    (suffix) => lower === suffix || lower.endsWith(`.${suffix}`),
  );
}

export const FACEBOOK_LIMITED_MESSAGE =
  "Limited monitoring — Owlert may not be able to reliably read recent Facebook posts.";
