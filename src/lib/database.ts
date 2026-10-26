import postgres, { type Sql } from "postgres";
import { getServerEnvironment } from "@/lib/env";

let sharedClient: Sql | undefined;

export function getDatabase(): Sql {
  if (sharedClient) return sharedClient;
  const environment = getServerEnvironment();
  if (!environment.DATABASE_URL) throw new Error("DATABASE_URL is required for persistent retrieval.");
  sharedClient = postgres(environment.DATABASE_URL, {
    max: 1,
    connect_timeout: 8,
    idle_timeout: 20,
    max_lifetime: 300,
    prepare: false,
  });
  return sharedClient;
}
