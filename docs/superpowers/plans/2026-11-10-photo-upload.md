# Private Submission Photo Upload Implementation Plan

**Goal:** Let a teacher create one submission per quiz/student and upload, inspect, reorder by page number, and confirm page photos without losing successful uploads.

**Architecture:** Authenticated server actions create a draft for an owned quiz and linked student. Bounded per-page route handlers validate and privately store JPEG/PNG files; authorized reads stream only an owner's photos. Drafts keep the teacher-provided page count and accept retries or replacement before confirmation.

**Tech Stack:** Next.js route handlers and server actions, TypeScript, PostgreSQL/Prisma, local private filesystem.

**Spec:** `MASTER_CONTEXT.md` submission workflow and teacher authorization; prototype limit of 10 pages and 8 MiB per page is provisional.

## Tasks

1. Test image validation, page counts, and safe private paths; add an additive expected-page-count migration.
2. Implement owner-scoped submission creation, per-page private upload/read/delete routes, and confirmation; reject unsupported images and oversized requests.
3. Add navigation and a teacher workflow with visible page order, retained upload progress, retries, and explicit completeness confirmation.
4. Verify tests, lint, build, migration, unauthorized access, and storage behavior, then commit.

## Constraints

- Never write student photos under `public/` or commit them.
- Recheck enabled teacher, quiz ownership, student link, submission ownership, and draft status on the server.
- Save each successful page independently. Duplicate page numbers cannot overwrite files.
- Confirmation requires exactly the expected page numbers and is a teacher action.
- No AI extraction or grading is implemented by this feature.
