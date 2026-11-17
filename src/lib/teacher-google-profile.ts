type SessionIdentity = { id?: string | null; name?: string | null; email?: string | null; image?: string | null };

export function teacherGoogleProfile(googleId: string, session?: SessionIdentity | null) {
  if (!session || !googleId || googleId.startsWith("local:") || session.id !== googleId) return null;
  let image: string | null = null;
  if (session.image) {
    try {
      const url = new URL(session.image);
      if (url.protocol === "https:" && url.hostname === "lh3.googleusercontent.com" && !url.username && !url.password) image = url.href;
    } catch { /* Use initials if the photo URL is invalid. */ }
  }
  return { name: session.name ?? null, email: session.email ?? null, image };
}
