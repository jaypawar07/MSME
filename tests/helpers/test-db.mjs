import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = fileURLToPath(new URL("../../", import.meta.url));

/** Recreates prisma/test.db from the current schema. Refuses to run against any other database. */
export function resetTestDatabase() {
  if (process.env.DATABASE_URL !== "file:./test.db") {
    throw new Error(`Refusing to reset non-test database: ${process.env.DATABASE_URL}`);
  }
  execSync("npx prisma db push --force-reset --skip-generate", {
    cwd: PROJECT_ROOT,
    env: process.env,
    stdio: "pipe",
  });
}
