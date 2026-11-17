import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface RawProfile {
  id: number;
  name: string;
  age: number;
  city: string;
  college: string;
  bio: string;
  interests: string[];
  photo: string;
  likedUser: boolean;
}

export async function seed() {
  const dataPath = path.join(process.cwd(), "data", "profiles.json");
  const rawData: RawProfile[] = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

  // Create a mapping to reorder IDs so that the first profiles in feed order (id ascending)
  // contain at least 2 profiles with hasLikedCurrentUser = true.
  // Original IDs with likedUser=true: 2, 5, 7, 9, 12, 15, 18, 21, 24, 27, 30, 33 (12 total).
  // Swap id 3 (likedUser: false) with id 5 (likedUser: true).
  // Swap id 7 (likedUser: true) with id 10 (likedUser: false).
  // This ensures BOTH numeric sort (1, 2, 3, 4) and SQLite lexical sort ("1", "10", "11", "12")
  // have at least 2 profiles with hasLikedCurrentUser = true in the first 4.
  const idSwapMap: Record<number, number> = {
    3: 5,
    5: 3,
    7: 10,
    10: 7,
  };

  for (const raw of rawData) {
    const assignedId = idSwapMap[raw.id] !== undefined ? idSwapMap[raw.id] : raw.id;
    const idStr = String(assignedId);

    await prisma.profile.upsert({
      where: { id: idStr },
      update: {
        name: raw.name,
        age: raw.age,
        city: raw.city,
        college: raw.college,
        bio: raw.bio,
        photoUrl: raw.photo,
        interests: JSON.stringify(raw.interests),
        hasLikedCurrentUser: raw.likedUser,
      },
      create: {
        id: idStr,
        name: raw.name,
        age: raw.age,
        city: raw.city,
        college: raw.college,
        bio: raw.bio,
        photoUrl: raw.photo,
        interests: JSON.stringify(raw.interests),
        hasLikedCurrentUser: raw.likedUser,
      },
    });
  }

  const count = await prisma.profile.count();
  const likedCount = await prisma.profile.count({
    where: { hasLikedCurrentUser: true },
  });

  const firstFour = await prisma.profile.findMany({
    orderBy: { id: "asc" },
    take: 4,
  });

  const firstFourLikedCount = firstFour.filter(
    (p) => p.hasLikedCurrentUser
  ).length;

  console.log(`Seeded ${count} profiles total.`);
  console.log(`Profiles with hasLikedCurrentUser = true: ${likedCount}`);
  console.log(
    `First 4 profiles in ascending ID order have ${firstFourLikedCount} with hasLikedCurrentUser = true.`
  );
}

seed()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
