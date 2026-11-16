"use server";

import { randomUUID } from "node:crypto";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { db } from "@/lib/db";
import { hashPassword, normalizeEmail, validRegistration } from "@/lib/password-auth";

export type AuthState = { error: string };

export async function login(_state: AuthState, form: FormData): Promise<AuthState> {
  try {
    await signIn("credentials", { email: normalizeEmail(form.get("email")), password: form.get("password"), redirectTo: "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Could not sign in. Check your details or try again in 15 minutes." };
    throw error;
  }
  return { error: "" };
}

export async function register(_state: AuthState, form: FormData): Promise<AuthState> {
  const name = typeof form.get("name") === "string" ? String(form.get("name")).trim() : "";
  const email = normalizeEmail(form.get("email"));
  const password = typeof form.get("password") === "string" ? String(form.get("password")) : "";
  if (!validRegistration(name, email, password)) return { error: "Enter your name, a valid email, and a password of 12–128 characters." };
  if (password !== form.get("confirmPassword")) return { error: "Passwords do not match." };
  const existing = await db.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, select: { id: true } });
  if (existing) return { error: "An account already uses this email. Sign in using your existing method." };
  try {
    await db.user.create({ data: { name, email, googleId: `local:${randomUUID()}`, passwordHash: await hashPassword(password) } });
  } catch {
    return { error: "Could not create your account. Try again or use a different email." };
  }
  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Account created. Please sign in." };
    throw error;
  }
  return { error: "" };
}

export async function registerStudent(_state: AuthState, form: FormData): Promise<AuthState> {
  const name = typeof form.get("name") === "string" ? String(form.get("name")).trim() : "";
  const email = normalizeEmail(form.get("email"));
  const password = typeof form.get("password") === "string" ? String(form.get("password")) : "";
  if (!validRegistration(name, email, password)) return { error: "Enter your name, a valid email, and a password of 12–128 characters." };
  if (password !== form.get("confirmPassword")) return { error: "Passwords do not match." };
  try {
    if (await db.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, select: { id: true } })) return { error: "An account already uses this email. Sign in using your existing method." };
    await db.user.create({ data: { name, email, googleId: `local:${randomUUID()}`, passwordHash: await hashPassword(password), role: "STUDENT" } });
  } catch { return { error: "Could not create your account. Try again or use a different email." }; }
  try { await signIn("credentials", { email, password, redirectTo: "/student" }); }
  catch (error) { if (error instanceof AuthError) return { error: "Account created. Please sign in." }; throw error; }
  return { error: "" };
}

export async function loginStudent(_state: AuthState, form: FormData): Promise<AuthState> {
  try { await signIn("credentials", { email: normalizeEmail(form.get("email")), password: form.get("password"), redirectTo: "/student" }); }
  catch (error) { if (error instanceof AuthError) return { error: "Could not sign in. Check your details or try again in 15 minutes." }; throw error; }
  return { error: "" };
}
