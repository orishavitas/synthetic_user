import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

export type Sql = NeonQueryFunction<false, false>;

/** Neon's driver talks HTTP under the hood, so a fresh client per request is cheap and safe in serverless. */
export function getSql(): Sql {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add the Neon Postgres integration to this Vercel project " +
        "(Storage tab) or set it manually in Project Settings > Environment Variables.",
    );
  }
  return neon(url);
}
