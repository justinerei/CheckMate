type GoogleProfile = { sub?: unknown; email?: unknown; email_verified?: unknown; name?: unknown };

export function googleIdentity(profile: GoogleProfile) {
  if (typeof profile.sub !== "string" || !profile.sub || typeof profile.email !== "string" || !profile.email || profile.email_verified !== true) return null;
  return { googleId: profile.sub, email: profile.email, name: typeof profile.name === "string" && profile.name ? profile.name : profile.email };
}
