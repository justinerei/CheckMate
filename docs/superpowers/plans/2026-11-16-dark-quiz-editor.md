# Dark Quiz Editor Implementation Plan

**Goal:** Adapt the existing quiz editor to the approved dark, focused question editor.
**Architecture:** Reuse the existing server actions and validation; change presentation and client form controls only. Keep section and quiz tools reachable.
**Tech Stack:** Next.js, React, CSS modules.
**Spec:** docs/superpowers/specs/2026-11-16-dark-quiz-editor-design.md

## Global Constraints
- Preserve backend, database schema, APIs, server actions, and form data contracts.
- Retain all question types, section management, quiz tools, locked quiz behavior, and responsive keyboard access.

## Review Focus
- Navigation preserves correct numbering for both numbering modes.
- Existing question edits and validation keep all field names and values.
- Essay rubric conflicts and locked quizzes remain accessible.
- Section management and quiz tools remain available.
- Narrow screens and long question lists remain usable.

## Task 1: Focused editor
- [ ] Add meaningful tests for question navigation selection and numbering; verify they fail first.
- [ ] Add a presentation helper and render section-grouped question navigation with one active form while preserving other controls.
- [ ] Match the reference form arrangement and correct answer controls using the existing form contract.
- [ ] Run tests, lint, and appropriate build checks; inspect the diff to confirm server actions are unchanged.
- [ ] Commit with a descriptive Conventional Commit message.
