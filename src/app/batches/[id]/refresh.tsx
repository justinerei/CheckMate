"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function Refresh({ active }: { active: boolean }) {
  const router = useRouter();
  useEffect(() => { if (!active) return; const timer = setInterval(() => router.refresh(), 4000); return () => clearInterval(timer); }, [active, router]);
  return null;
}
