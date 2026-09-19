import type { VercelRequest } from "@vercel/node";

/** Checks `Authorization: Bearer <expectedKey>`. Fails closed if expectedKey is unset. */
export function isAuthorized(req: VercelRequest, expectedKey: string | undefined): boolean {
  if (!expectedKey) return false;

  const header = req.headers.authorization;
  const value = Array.isArray(header) ? header[0] : header;
  if (!value) return false;

  const [scheme, token] = value.split(" ");
  return scheme === "Bearer" && token === expectedKey;
}
