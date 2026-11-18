import { execSync } from "child_process";

export async function setup() {
  process.env.DATABASE_URL = "file:./test.db";
  process.env.ENABLE_DEMO_RESET = "true";

  console.log("\n[Vitest globalSetup] Pushing schema to test.db...");
  execSync("npx prisma db push --force-reset --skip-generate", {
    env: {
      ...process.env,
      DATABASE_URL: "file:./test.db",
    },
    stdio: "inherit",
  });

  console.log("[Vitest globalSetup] Seeding test.db...");
  execSync("npx tsx prisma/seed.ts", {
    env: {
      ...process.env,
      DATABASE_URL: "file:./test.db",
    },
    stdio: "inherit",
  });
}

export async function teardown() {
  // Teardown logic if needed
}
