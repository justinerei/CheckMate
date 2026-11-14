"use client";
import { useEffect } from "react";
import { printDocumentTitle } from "@/lib/print-document-title";

export default function PrintDocumentTitle({ title, kind }: { title: string; kind: "quiz" | "answer-key" }) {
  useEffect(() => {
    const previous = document.title;
    document.title = printDocumentTitle(title, kind);
    return () => { document.title = previous; };
  }, [title, kind]);
  return null;
}
