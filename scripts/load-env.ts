import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const envFile = fileURLToPath(new URL("../.env.local", import.meta.url));

// Keep shell-provided values authoritative; load the local file for standalone scripts.
if (existsSync(envFile)) process.loadEnvFile(envFile);
