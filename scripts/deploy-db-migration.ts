import { execFileSync } from "node:child_process";
import path from "node:path";

const migrationName = "202611250001_study_storage";
const prismaCommand = process.platform === "win32" ? "prisma.cmd" : "prisma";
const migrationFile = path.join(process.cwd(), "prisma", "migrations", migrationName, "migration.sql");

function run(args: string[]) {
  execFileSync(prismaCommand, args, { env: process.env, stdio: "inherit" });
}

try {
  run(["migrate", "deploy"]);
} catch {
  // Existing production databases need a one-time baseline. The migration is
  // additive and uses IF NOT EXISTS, so this does not drop legacy tables.
  run(["db", "execute", "--schema", path.join(process.cwd(), "prisma", "schema.prisma"), "--file", migrationFile]);
  try {
    run(["migrate", "resolve", "--applied", migrationName]);
  } catch {
    // A concurrent deployment may have recorded the migration already.
  }
  run(["migrate", "deploy"]);
}
