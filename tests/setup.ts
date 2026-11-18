import { beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";

beforeEach(async () => {
  await prisma.match.deleteMany();
  await prisma.swipe.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
