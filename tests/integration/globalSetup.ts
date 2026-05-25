import { execSync } from "node:child_process";
import { Client } from "pg";

const TEST_DB = "lab_orders_lite_test";
const ADMIN_URL = "postgresql://postgres:postgres@localhost:5432/postgres?schema=public";

async function ensureTestDatabase() {
  const client = new Client({ connectionString: ADMIN_URL });
  await client.connect();
  try {
    const result = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [TEST_DB]);
    if (result.rowCount === 0) {
      await client.query(`CREATE DATABASE ${TEST_DB}`);
      console.log(`[test] created database ${TEST_DB}`);
    }
  } finally {
    await client.end();
  }
}

export default async function setup() {
  if (!process.env.DATABASE_URL?.includes("_test")) {
    throw new Error(
      `Integration tests require DATABASE_URL pointing at a *_test database. Got: ${process.env.DATABASE_URL}`,
    );
  }
  await ensureTestDatabase();
  execSync("pnpm exec prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env },
  });
}
