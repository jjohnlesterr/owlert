import "server-only";

import dns from "node:dns/promises";
import net from "node:net";

function ipv4ToInt(ip: string): number {
  return ip
    .split(".")
    .reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0;
}

function inV4Range(ip: string, base: string, bits: number): boolean {
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipv4ToInt(ip) & mask) === (ipv4ToInt(base) & mask);
}

function isPrivateIPv4(ip: string): boolean {
  return (
    inV4Range(ip, "10.0.0.0", 8) ||
    inV4Range(ip, "172.16.0.0", 12) ||
    inV4Range(ip, "192.168.0.0", 16) ||
    inV4Range(ip, "127.0.0.0", 8) ||
    inV4Range(ip, "169.254.0.0", 16) || // includes the 169.254.169.254 cloud metadata address
    inV4Range(ip, "0.0.0.0", 8)
  );
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  return (
    lower === "::1" ||
    lower === "::" ||
    lower.startsWith("fc") ||
    lower.startsWith("fd") ||
    lower.startsWith("fe80")
  );
}

/**
 * Validates a user-supplied URL is safe to fetch server-side: http(s) only,
 * and resolves only to public IP addresses (blocks localhost, private/
 * reserved ranges, and the cloud metadata address). Throws a user-facing
 * Error message on rejection.
 *
 * Note: this is a pre-flight DNS check, not a fully rebinding-proof fetch
 * (it doesn't pin the resolved IP for the actual request). Good enough for
 * a hackathon MVP; a production version would connect to the checked IP
 * directly rather than re-resolving at fetch time.
 */
export async function assertPublicHttpUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new Error("Enter a valid URL, e.g. https://example.com/news");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http:// and https:// URLs are supported.");
  }

  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".local")) {
    throw new Error("Local addresses aren't allowed.");
  }

  const literalFamily = net.isIP(hostname);
  if (literalFamily) {
    const isPrivate =
      literalFamily === 4 ? isPrivateIPv4(hostname) : isPrivateIPv6(hostname);
    if (isPrivate) {
      throw new Error("Private or internal addresses aren't allowed.");
    }
    return url;
  }

  let addresses: string[];
  try {
    addresses = (await dns.lookup(hostname, { all: true })).map(
      (r) => r.address,
    );
  } catch {
    throw new Error("Couldn't resolve that domain name.");
  }

  if (addresses.length === 0) {
    throw new Error("Couldn't resolve that domain name.");
  }

  for (const address of addresses) {
    const family = net.isIP(address);
    const isPrivate =
      family === 4 ? isPrivateIPv4(address) : isPrivateIPv6(address);
    if (isPrivate) {
      throw new Error(
        "That domain resolves to a private/internal address, which isn't allowed.",
      );
    }
  }

  return url;
}
