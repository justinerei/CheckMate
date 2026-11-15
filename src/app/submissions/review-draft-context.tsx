"use client";
import { createContext, useContext } from "react";

type ReviewDraftGuard = { markDirty: (id: string) => void; saveResult: (id: string, ok: boolean) => void };
export const ReviewDraftContext = createContext<ReviewDraftGuard | null>(null);
export function useReviewDraftGuard() { return useContext(ReviewDraftContext); }
