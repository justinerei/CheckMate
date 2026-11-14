# CheckMate

CheckMate is a prototype web app for teachers to create standardized quizzes and, eventually, review photographed student papers. Teachers create quizzes in the app; students do not need an account.

The current build supports Google sign-in, a teacher dashboard, shared student records, quiz drafts, sections and questions, answer keys, essay rubrics, a printable quiz preview, private page-by-page submission photo upload, and AI-assisted answer review. Automated grading is still in development. Use sample data while developing.

## Before you start

Install these on your computer:

- **Git**: [git-scm.com](https://git-scm.com/downloads)
- **Node.js 22.12 or newer in the 22.x line**: [nodejs.org](https://nodejs.org/). Node 22.18 was used during development. Prisma also supports Node 20.19+ in the 20.x line or Node 24+.
- **PostgreSQL** and, optionally, **pgAdmin**: [postgresql.org/download](https://www.postgresql.org/download/)
- A Google account and internet access for the Google sign-in setup.

Check your installations in a terminal:

```bash
git --version
node --version
npm --version
```

The instructions below use Windows PowerShell. On macOS or Linux, use your terminal and replace `Copy-Item` in step 3 with `cp`.

## 1. Clone the repository

Open a terminal in the folder where you want to keep the project:

```powershell
git clone https://github.com/justinerei/CheckMate.git
cd CheckMate
```

All commands below should be run from this `CheckMate` folder.

## 2. Create an empty PostgreSQL database

Make sure the PostgreSQL server is running. In pgAdmin, connect to your local server, right-click **Databases**, choose **Create → Database**, enter `checkmate`, and save.

Use a new, empty local database. You will need your PostgreSQL username, password, and port; the usual local port is `5432`. The password is the one you chose when installing PostgreSQL, not your Google password.

## 3. Set up environment variables

Create a local environment file from the included template:

```powershell
Copy-Item .env.example .env.local
```

On macOS or Linux:

```bash
cp .env.example .env.local
```

Open `.env.local` in your editor. It stays on your computer and is ignored by Git. Set these values:

```env
DATABASE_URL="postgresql://YOUR_DB_USER:YOUR_DB_PASSWORD@localhost:5432/checkmate?schema=public"
GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"
AUTH_SECRET="YOUR_RANDOM_SECRET"
AUTH_URL="http://localhost:3000"
GROQ_API_KEY=
```

- Replace the database username, password, port, and database name with your own values. If the username or password contains URL characters such as `@`, `:`, `/`, `$`, or `%`, [percent-encode them](https://www.prisma.io/docs/orm/v7/reference/connection-urls#special-characters) in the connection string.
- Generate a unique `AUTH_SECRET` by running the command below, then paste its output into `.env.local`. Keep it private.

  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```

- Get the Google values in step 4. Add a Groq API key to use answer extraction; the key remains on the server. Optionally set `GROQ_VISION_MODEL` to override the default model `qwen/qwen3.8-27b`.
- Do not commit or share `.env.local`, your database password, Google client secret, or auth secret. If a credential is exposed, replace it.

## 4. Configure Google sign-in

You can create your own local OAuth client, or ask the project owner to arrange an approved development client. Do not post shared credentials in the repository or group chat.

To create your own:

1. Open [Google Cloud Console](https://console.cloud.google.com/) and create a project, or select an existing development project.
2. Open **Google Auth Platform → Overview** and click **Get started**. Set the app name and contact details, and select **External** for the audience if you are using regular Google accounts.
3. Under **Audience → Test users**, add the Google account you will use to sign in. While the app is in testing mode, only added test users can sign in.
4. Under **Clients**, choose **Create client → Web application**.
5. Add this exact **Authorized redirect URI**:

   ```text
   http://localhost:3000/api/auth/callback/google
   ```

6. Create the client. Copy its **Client ID** and **Client secret** into `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in your `.env.local` file, then save the file.

The callback is for local development only. If you use a different port, the redirect URI and `AUTH_URL` must match that port. See the [Auth.js Google provider guide](https://authjs.dev/reference/core/providers/google).

## 5. Install dependencies and apply the migration

```bash
npm ci
npx prisma migrate deploy
npx prisma migrate status
```

`npm ci` installs the locked dependencies and generates the Prisma client. The migration creates the application tables in the database referenced by `DATABASE_URL`. The status command should say the database schema is up to date.

Do not run `prisma migrate reset` against a database containing data you want to keep: it deletes data.

## 6. Start CheckMate

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), click **Continue with Google**, and sign in with the test user you added. Keep the terminal running while using the app; press `Ctrl+C` there to stop it.

Each groupmate's local PostgreSQL database starts empty. Cloning the repo does not copy someone else's accounts, quizzes, or student data. Signing in for the first time creates a teacher account in your own local database.

On the dashboard, open **Students** to create a student record or link an existing record using its CheckMate sharing code. The sharing code works between teachers connected to the **same database**; separate local databases do not share records. Treat codes as private and share them only with teachers who need the student on their list. Creating a second record for the same student can produce duplicates; merging is not available yet.

Open **Submissions** to choose a saved quiz or answer key and start a batch; no student record is required. Each batch contains up to five papers, and each paper has one to three JPEG or PNG photos, up to 8 MB each. Check the page order before starting. The server reads pages in the background and saves each successful reading. Review and finalize results per paper.

### Create a quiz in CheckMate

Create a draft, then set the total question count and divide it into multiple-choice, identification, true/false, or essay sections. Use the drag handle (hold and drag on a touchscreen) or the up/down arrows to change section order. Confirm the outline to create numbered question slots; fill in and save each question and its answer or rubric. You can return to the outline while the generated slots and section settings are still untouched. Once you have started editing, use **Reorder sections** in the quiz editor to move whole sections with their saved questions and answers; save any open edits before saving the new order. Section reordering is locked once a quiz has papers. Complete every slot before previewing, printing, or checking papers. You may also skip the outline and build sections manually.

### Suggest questions from modules

In a draft quiz, open **Suggest questions from modules**. Upload up to three text-based PDFs (10 MB and 150 pages each). CheckMate extracts text in the browser and saves the extracted text and page references with the quiz in PostgreSQL; it does not store the original PDFs. Scanned or image-only pages are not supported and pages without readable text are marked. A PDF may contain up to 250,000 extracted characters and 8,000 characters per page; split larger files before uploading. You can remove a module after use. Back up the database if you need to preserve extracted module text.

Choose the modules, optionally exclude pages after reviewing their automatically detected headings, and select a quiz section and difficulty. CheckMate samples up to six bounded excerpts per request, favoring lesson-like headings; sampling is heuristic and does not guarantee full coverage or exclude every activity. **Suggest next questions** uses at most ten empty slots per click, in sequential groups of five. The chosen excerpts are sent to Groq and use the configured account quota. Existing saved questions are never replaced. Unsaved suggestions are temporary and disappear if you leave or reload the editor. Review the cited module and page, edit the question and answer, and save each question individually; this creates the quiz answer key. Essay suggestions use editable default rubric criteria that the teacher must review. Regenerating a draft or section requires confirmation and may consume additional requests. AI output and source references can be inaccurate; teacher review remains necessary.

`GROQ_TEXT_MODEL` optionally selects a Groq text model for question suggestions; when unset the app uses `GROQ_VISION_MODEL` or its default. Availability, rate limits and any billing depend on the configured Groq account. The app does not silently upgrade an account.

### Check a quiz made elsewhere

Choose **Check an existing quiz** on the dashboard. Upload a PDF (up to 10 pages and 10 MB), JPEG, or PNG of the answer key, or enter answers manually. Reading an uploaded key requires `GROQ_API_KEY`; its pages are sent to Groq. Review and correct all detected answers against the original preview, select the expected answer style for each section, set points, and save the key. Questions must currently use consecutive numbers starting at 1, and all questions in a section must use the same answer style. Use `|` between alternative accepted answers. The preview is temporary: the answer key file is not retained after leaving the page.

To correct a saved key, open the existing quiz from the dashboard and select **Edit correct answers**. Saving a correction recalculates affected finalized scores and records the change. The same **Edit correct answers** action is available for quizzes created in CheckMate, including after papers have been added. Multiple-choice corrections must use an existing choice, true/false answers use T or F, and identification alternatives use |. This editor changes correct answers only; changing question types, points, sections, rubrics, or directions after papers have been added is not supported.

For new essay questions, enter a rubric manually or ask Groq to suggest an editable rubric using the essay question or a quiz-page photo. Confirm the criteria before saving the key; their maximum points must add up to the question's points. During paper review, teachers can enter per-criterion scores and feedback or ask Groq for suggestions, then check and confirm them. The essay score is the sum of the teacher-confirmed criterion scores. Earlier quizzes without rubrics retain their manual overall-score flow. AI suggestions can be inaccurate and require teacher review.

While creating an existing quiz, the unsaved answer-key draft is stored in the current browser for the signed-in teacher. It does not include uploaded files, so select those again after reopening. Clear the browser's site data when a shared device should no longer retain its drafts. After selecting key photos or PDFs, review the files and choose **Scan answer key** to send their pages to Groq in the selected order; use up to 10 pages total.

Create a paper submission and upload JPEG or PNG photos. Check their order and select **Start checking** to confirm the pages and send them to Groq one at a time. The teacher confirms the suggested name written on the paper or marks it unreadable. Optionally, use **Link to a student** in the review to associate the paper with a student from your list; this does not change the confirmed paper name. You can change or remove the link while the paper is in review. A student can have one linked paper per quiz. Clear objective answers with an identifiable mark are compared automatically against the key; ambiguous, missing, blank, conflicting, or uncertain responses and essay scores require teacher review. A detected answer style that differs from the instructions is flagged for teacher review; the teacher decides whether it is an instruction violation. Open **View checked answers** to inspect and correct automatic readings. AI can make mistakes even when it reports a clear answer, so verify the original photos as appropriate. If a page cannot be read, retry it or manually review every answer before finalizing. Objective answers are compared case-insensitively; essay criterion scores are confirmed by the teacher. A score breakdown appears before finalization. Finalizing saves and locks the result. To correct a finalized paper, open its score, choose **Reopen for correction**, and enter a reason. Review the answers and finalize again; the score history records the reason and the previous and revised scores.

For an objective-question section that forbids erasures, add **No erasures.** as a separate sentence in its saved directions. Newly read papers with a clearly detected erasure are proposed as zero for that question; uncertain or older readings without an erasure observation require teacher review. Without that rule, an erasure alone does not automatically make the answer incorrect. The teacher can inspect and correct the decision before finalizing. Detection is AI-based and should be evaluated with representative photos. Essays remain teacher scored.

Uploaded photos are stored in the ignored `.private/uploads/` folder, outside `public/`. They are separate from PostgreSQL: back up and restore **both** the database and this private folder together when moving or preparing the demo. Do not commit the folder or put student photos in `public/`. Local data and photos are not shared with groupmates who use separate installations.

## Useful commands

### Batch checking

Start a batch from **Check a paper** and choose a saved quiz or answer key. Each batch holds up to five papers, and each paper can have one to three photos. Confirm the first paper's pages to start checking; use **Add another paper** on the batch page to add the rest. Review and finalize each result individually. On the quiz overview, choose **Export finalized scores · CSV** to download the names, scores, maximum points, and finalization timestamps (UTC) for finalized papers. For linked papers the export uses the student record name; otherwise it uses the confirmed paper name. Papers still in review are excluded.

The local Next.js server processes queued pages in the background, one at a time. Keep the server and PostgreSQL running; the browser can be closed. If the server stops, restart it to resume pending pages. Rate-limited pages wait and retry; other failed pages can be retried from their photo page. Review all AI readings against the original paper, including answers that appear clear.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run lint` | Check code style and common errors |
| `npm test` | Run the automated tests |
| `npm run build` | Create and check a production build |
| `npx prisma migrate status` | Check migration status |

## Getting the latest changes

Commit or safely set aside your own changes first, then run:

```bash
git pull origin main
npm ci
npx prisma migrate deploy
```

Restart the development server afterward. The migration command applies pending migrations; it does not copy another groupmate's local data.

## Troubleshooting

- **Database connection or authentication error:** Check that PostgreSQL is running, the database exists, and `DATABASE_URL` has the correct username, password, host, and port. Percent-encode reserved characters in credentials.
- **`redirect_uri_mismatch`:** Check that the Google OAuth client has `http://localhost:3000/api/auth/callback/google` exactly, and that the app is running on port 3000.
- **Google says access is blocked / app is in testing:** Add the signing-in Google account under **Google Auth Platform → Audience → Test users** for the selected project.
- **Port 3000 is already in use:** Stop the other process, or deliberately configure a different port and update both `AUTH_URL` and the Google redirect URI to match.
- **Environment changes do not take effect:** Save `.env.local` and restart `npm run dev`.
- **Prisma client is missing:** Run `npx prisma generate`, then restart the dev server.
- **Print preview looks different from the paper:** Use a current Chrome, Edge, or Brave browser, check the selected paper size, print at 100% scale, and turn off the browser's headers and footers. Verify the actual print preview before printing.

For an error you cannot resolve, share the error message with the group after removing credentials, connection strings, and other private information.
