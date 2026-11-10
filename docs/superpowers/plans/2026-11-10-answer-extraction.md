# Page Answer Extraction and Review Plan

**Goal:** Extract answers from confirmed page photos with Groq, retaining per-page progress and requiring teacher review.

**Architecture:** Each confirmed page is processed independently using a leased, owner-authorized request. Validated model output is retained per page; teacher-reviewed answers are saved separately by question. Ambiguous or duplicate question identifiers are not silently assigned, and AI never grades or finalizes.

**Stack:** Next.js, PostgreSQL/Prisma, Groq Chat Completions with `qwen/qwen3.8-27b`, local private photos.

**Spec:** `MASTER_CONTEXT.md` and teacher-confirmed page order. Google and Groq credentials remain server-side.

## Tasks

1. Test response validation, mapping, and 429 retry handling; add a non-destructive migration for page results and processing leases.
2. Implement owner-scoped, one-page-at-a-time extraction with a timeout, stale-lease recovery, retry-after handling, and atomic result persistence.
3. Add an explicit process action and a review screen with page photos, flagged/unmatched results, and individually saved teacher corrections.
4. Verify validation, isolation, persistence, and build; test a real sample only when a Groq key and sample image are available, and commit the work.

## Constraints

- Do not overwrite confirmed teacher answers during extraction or retry.
- Never send any photo until the teacher explicitly requests extraction; use one page per request.
- Treat each Groq response as untrusted data; never silently choose among multiple or uncertain marks.
- No automatic grading or finalization in this feature.
- Keep partial results and respect 429 retry timing.
