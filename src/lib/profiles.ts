/**
 * Shared profile utilities and strict public field projection.
 *
 * PRIVACY GUARANTEE:
 * `hasLikedCurrentUser` must NEVER be exposed to the client in any API response.
 * Only the whitelisted public fields defined below may be sent across the wire.
 */

export const CURRENT_USER_ID = "me";

export interface PublicProfile {
  id: string;
  name: string;
  age: number;
  photoUrl: string;
  bio: string;
  city: string;
  college: string;
  interests: string[];
}

export interface PublicMatch extends PublicProfile {
  matchedAt: Date | string;
}

/**
 * Projects a raw database profile onto the public field whitelist.
 * Strips `hasLikedCurrentUser` and parses JSON interests.
 */
export function toPublicProfile(profile: {
  id: string;
  name: string;
  age: number;
  photoUrl: string;
  bio: string;
  city: string;
  college: string;
  interests: string;
  [key: string]: unknown;
}): PublicProfile {
  let parsedInterests: string[] = [];
  try {
    parsedInterests = JSON.parse(profile.interests);
    if (!Array.isArray(parsedInterests)) {
      parsedInterests = [];
    }
  } catch {
    parsedInterests = [];
  }

  return {
    id: profile.id,
    name: profile.name,
    age: profile.age,
    photoUrl: profile.photoUrl,
    bio: profile.bio,
    city: profile.city,
    college: profile.college,
    interests: parsedInterests,
  };
}

/**
 * Evaluates whether a swipe constitutes a mutual match.
 * A match is created IF AND ONLY IF the direction is "LIKE" AND the target profile
 * already liked the current user.
 */
export function isMutualMatch(
  direction: string,
  hasLikedCurrentUser: boolean
): boolean {
  return direction === "LIKE" && hasLikedCurrentUser === true;
}
