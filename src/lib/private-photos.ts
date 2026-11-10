import "server-only";
import path from "node:path";
import { mkdir, open, readFile, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { privatePhotoPath } from "@/lib/submission-upload";

const root = path.join(process.cwd(), ".private", "uploads");

function resolvePhoto(name: string) {
  if (!privatePhotoPath(name)) throw new Error("Invalid photo reference");
  return path.join(root, name);
}

export async function writePhoto(data: Uint8Array, format: "jpg" | "png") {
  await mkdir(root, { recursive: true, mode: 0o700 });
  const name = `${randomUUID()}.${format}`;
  const file = await open(resolvePhoto(name), "wx", 0o600);
  try { await file.writeFile(data); } catch (error) { await file.close(); await unlink(resolvePhoto(name)).catch(() => {}); throw error; }
  await file.close();
  return name;
}

export async function readPhoto(name: string) { return readFile(resolvePhoto(name)); }
export async function deletePhoto(name: string) { await unlink(resolvePhoto(name)); }
