# Initial Database Implementation Plan

**Goal:** Define the approved CheckMate PostgreSQL model and a reproducible initial migration.

**Architecture:** Prisma models shared students and teacher-owned quizzes and submissions. The schema stores review and grading history; application features must implement authorization, score recalculation, locking, and audit writes transactionally.

**Tech Stack:** PostgreSQL, Prisma Migrate, Next.js environment loading.

**Spec:** Approved schema and quiz-format decisions in the conversation and `MASTER_CONTEXT.md`.

## Tasks

1. Add the Prisma schema and configuration. Validate the models and generate an initial SQL migration from an empty schema.
2. Verify unique constraints and foreign keys against an empty PostgreSQL database; do not reset or overwrite an existing database.
3. Document configuration and migration commands, run project checks, and commit the schema.

## Review Focus

- One submission per student and quiz, while preserving the submission owner.
- A shared student is linked to teachers without exposing other teachers' submissions.
- Repeated printed question numbers remain distinguishable through internal IDs.
- Changes to answer keys and results preserve their history.
- Page retries and teacher corrections retain existing review data.

Authorization, quiz locking, automatic score updates, and audit creation require future application logic; schema alone does not enforce those behaviors.
