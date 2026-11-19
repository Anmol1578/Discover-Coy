import { beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";

beforeEach(async () => {
  delete process.env.USE_STATIC_DATA;
  await prisma.match.deleteMany();
  await prisma.swipe.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
