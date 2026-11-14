import { redirect } from "next/navigation";

// Preserve old bookmarks after removing the separate papers list.
export default function SubmissionsRedirect() { redirect("/dashboard"); }
