# CheckMate — Master Context

## Project Overview

**Working name:** CheckMate  
**Description:** An AI-assisted web application for creating standardized quizzes and checking photographed student papers.  
**Deadline:** November 17.  
**Budget:** No paid services planned; use free tiers and local infrastructure for the prototype.

The teacher creates a quiz in CheckMate, prints the generated standardized quiz sheets, uploads photographs of a student's completed pages, reviews the extracted answers and suggested grading, and finalizes one combined result. AI assists the teacher; it does not finalize grades.

## Users and Access

- **Teacher:** Registers and signs in with a Google account; creates quizzes, answer keys and essay rubrics; uploads submissions; reviews and corrects extracted answers; and finalizes results. Registration is open to Google accounts. Teachers may access only their own quizzes and student submissions.
- **Admin:** Uses a separate dashboard to view basic system counts and manage teacher access, including enabling or disabling teacher accounts. The initial admin is configured separately; ordinary Google sign-ins default to teacher. Admins do not need access to student answers or grades in the first version.
- **Student:** Has a record associated with submissions, but no login in the first version.

## Quiz Creation and Printed Template

Teachers create quizzes within the web application. Every quiz uses a standardized, system-generated printable template. Teachers define:

- Questions and choices for multiple-choice items.
- True/False questions.
- Correct answers and points for objective questions.
- Essay questions, criteria, criterion descriptions, and maximum points.
- Expected pages, derived from or confirmed against the generated layout.

The template should provide adequate space to circle answers and handwrite essays, and identify the quiz and page number. Page grouping and order are confirmed by the teacher; warn about missing or duplicate pages. Exact template layout and page-identification method remain implementation decisions to validate with sample photos.

## Submission and Checking Workflow

1. The teacher signs in with Google and creates a quiz and its printable template.
2. The teacher selects the quiz and student, uploads photos for all pages of that student's paper, and confirms the page order and completeness.
3. The application sends the images to a Groq vision-capable model for extraction of circled answers and handwritten essay text. Multiple photos are grouped as one submission; support handling a failed page without losing completed work.
4. The teacher reviews the original photos alongside all extracted answers and corrects mistakes. Flag blank, unclear, multiple, or potentially erased answers when detected; allow teacher decisions on erasures and ambiguous marks. AI may miss problems, so every answer remains reviewable.
5. Application code compares the confirmed multiple-choice and True/False answers with the saved answer key and computes the objective score. Apply teacher decisions to ambiguous answers; never silently select an answer when multiple marks were detected.
6. Groq evaluates the confirmed essay transcription against the criteria set by the teacher and suggests criterion scores and feedback. The teacher may edit the transcription and request a new assessment, and may change the suggested score and feedback.
7. The teacher reviews and finalizes one combined result. Corrections to objective answers recalculate the score. Saving a final grade is a teacher action, not an AI action.

## Technology Direction

- **Application:** Next.js and TypeScript, including server-side endpoints and application logic.
- **Database:** PostgreSQL, initially local for development and the presentation setup.
- **Authentication:** Google OAuth for teacher registration and login; the specific Next.js authentication library remains to be selected.
- **Photos:** Local file storage for the prototype; save references in the database and restrict access to authorized teachers. Database and photo files must both be transferred and backed up for the demo.
- **AI:** Groq API on the free tier, using the vision model tested in the Playground if it remains available. Keep API credentials on the server.
- **Image processing:** OpenCV or local OCR are optional future additions if tests demonstrate that Groq alone is insufficient; neither is required for the initial build.

The app, PostgreSQL, and saved photos can run on the presentation laptop after setup. Internet is required for Groq and Google sign-in. The exact hosting and deployment arrangement is not yet decided.

## Prototype Evidence and Constraints

- A two-page sample submission was correctly read in the Playground, including intentionally incorrect circled answers and two essay transcriptions. The user reported consistent repeat runs for the clear two-page photos.
- In earlier tests, the model missed a double circle, including once with temperature set to zero. Clear photos improved the observed outcome, but the sample is too small to establish general accuracy.
- Text-only essay tests produced plausible scores for strong, middle, and weak answers when the rubric was made explicit. Essay scores remain suggestions for teacher review.
- A two-image request hit Groq's input-tokens-per-minute limit. Show a processing/waiting state, respect retry information on HTTP 429, and preserve progress. Free-tier quotas and model availability may change.
- Good lighting, legible handwriting, and readable photos should be encouraged. Validate with different handwriting, erasures, blank answers, multiple marks, missing pages, and poor-quality photos.

## Scope and Decisions Still Needed

- First version focuses on one student submission at a time with multiple pages. Bulk class processing and analytics beyond admin counts are future options.
- Decide the exact first-version page limit after testing Groq request size, quota, and the quiz layout. Do not assume unlimited pages per request.
- Decide the precise grading policy for blanks, multiple answers, and erasures; teachers must be able to resolve ambiguous cases before finalization.
- Decide how the first admin is provisioned and how disabled accounts are enforced.
- Establish a reliable local demo setup and backup, including PostgreSQL, photos, Google OAuth configuration, and internet availability.
- Define privacy and retention practices for student papers; use sample data during development and restrict access to real submissions.

## Key Principle

CheckMate assists the teacher. AI output is fallible, and the teacher reviews and finalizes the grade.

## Design Direction

- Use the [bryl-minimal design language](https://github.com/bryllim/bryl-minimal-design/blob/main/SKILL.md) as a project-wide visual reference: typography-led minimalism, grayscale surfaces, fine borders, generous spacing, restrained motion, and occasional halftone texture.
- **Project exception:** CheckMate may use an accent color. The approved visual direction uses a restrained orange accent (starting point `#FF6A00`) against a near-black, charcoal, and off-white palette. Use it intentionally for emphasis and review states rather than filling the interface with color; keep status labels and icons clear without relying on color alone.
- Use pixel or dot-matrix typography for selected display text, statistics, and short labels. Use a highly readable sans-serif for questions, answers, forms, and other sustained reading. The skill's Geist and Geist Pixel font roles are starting points, subject to availability and legibility.
- Adapt the reference's narrow editorial layout to the task: submission review needs enough space to view the original paper and editable answers together. Preserve keyboard focus visibility, readable contrast, responsive layouts, and reduced-motion preferences.
- The dark visual concept is the approved starting direction. If light and system themes are implemented, preserve the same hierarchy and accessible contrast across themes.

## Project Directory Structure

```text
CheckMate/
├── MASTER_CONTEXT.md       Project requirements and decisions
├── public/
│   └── images/             Public app images, icons, and illustrations
├── src/
│   ├── app/                Next.js routes, page views, layouts, and route handlers
│   ├── components/         Reusable React UI components
│   ├── lib/                Shared helpers and server-side integrations
│   └── types/              Shared TypeScript types
├── package.json            Dependencies and npm scripts
└── tsconfig.json           TypeScript configuration and @/* alias
```

- Create route folders under `src/app/`, with a `page.tsx` file for each page. Route handlers belong in `route.ts` files under `src/app/api/` when needed.
- Keep reusable components under `src/components/` and route-specific components alongside their route when practical.
- Reference app assets under `public/images/` using paths such as `/images/example.png`.
- Student paper photos are private and must never be stored in `public/`; decide and secure a separate local upload location during implementation.
- Keep secrets in ignored environment files, not in source code or public assets.
- Add further folders only when the corresponding feature is implemented.
