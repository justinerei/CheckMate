import nextEnv from '@next/env';
import pg from 'pg';
import { hashPassword, validRegistration } from '../src/lib/password-auth.ts';

nextEnv.loadEnvConfig(process.cwd());
const password = process.env.CHECKMATE_DEMO_PASSWORD ?? '';
const email = 'demo@checkmate.test';
if (process.env.NODE_ENV === 'production') throw new Error('The demo seeder cannot run in production.');
if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL before running the seeder.');
const database = new URL(process.env.DATABASE_URL);
if (!['localhost', '127.0.0.1', '[::1]'].includes(database.hostname)) throw new Error('The demo seeder only runs against a local database.');
if (!validRegistration('Demo Teacher', email, password)) throw new Error('Set CHECKMATE_DEMO_PASSWORD to a password of 12–128 characters.');
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
const questions = [
  ['Which planet is known as the Red Planet?', ['Earth', 'Mars', 'Venus', 'Jupiter'], 'B'],
  ['Which organ pumps blood around the body?', ['Lungs', 'Heart', 'Brain', 'Stomach'], 'B'],
  ['What do plants absorb from the air?', ['Carbon dioxide', 'Helium', 'Hydrogen', 'Neon'], 'A'],
];
await client.connect();
try {
  await client.query('BEGIN');
  const collision = await client.query('SELECT id FROM "User" WHERE lower(email) = $1', [email]);
  if (collision.rows.some(row => row.id !== 'checkmate-demo-teacher')) throw new Error('Demo email belongs to another account; seeding stopped.');
  const hash = await hashPassword(password);
  await client.query('INSERT INTO "User" (id, "googleId", email, name, "passwordHash", "updatedAt") VALUES ($1,$2,$3,$4,$5,NOW()) ON CONFLICT (id) DO NOTHING', ['checkmate-demo-teacher', 'local:checkmate-demo-teacher', email, 'Demo Teacher', hash]);
  for (const [i, name] of ['Alex Santos', 'Jamie Reyes', 'Sam Cruz'].entries()) {
    const id = `checkmate-demo-student-${i + 1}`;
    await client.query('INSERT INTO "Student" (id, code, name, "updatedAt") VALUES ($1,$2,$3,NOW()) ON CONFLICT (id) DO NOTHING', [id, `CM-DEMO000${i + 1}-00000000-00000000-00000000`, name]);
    await client.query('INSERT INTO "TeacherStudent" ("teacherId", "studentId") VALUES ($1,$2) ON CONFLICT DO NOTHING', ['checkmate-demo-teacher', id]);
  }
  await client.query('INSERT INTO "Quiz" (id, "teacherId", title, "updatedAt") VALUES ($1,$2,$3,NOW()) ON CONFLICT (id) DO NOTHING', ['checkmate-demo-quiz', 'checkmate-demo-teacher', 'Sample Science Quiz']);
  await client.query('INSERT INTO "QuizSection" (id, "quizId", title, instructions, position) VALUES ($1,$2,$3,$4,1) ON CONFLICT (id) DO NOTHING', ['checkmate-demo-section', 'checkmate-demo-quiz', 'Multiple Choice', 'Choose the correct answer.']);
  for (const [i, [question, choices, answer]] of questions.entries()) {
    const id = `checkmate-demo-question-${i + 1}`;
    await client.query('INSERT INTO "Question" (id, "sectionId", type, text, position, points) VALUES ($1,$2,$3,$4,$5,1) ON CONFLICT (id) DO NOTHING', [id, 'checkmate-demo-section', 'MULTIPLE_CHOICE', question, i + 1]);
    for (const [j, choice] of choices.entries()) await client.query('INSERT INTO "QuestionChoice" (id, "questionId", label, text, position) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING', [`${id}-choice-${j + 1}`, id, 'ABCD'[j], choice, j + 1]);
    await client.query('INSERT INTO "AnswerKey" (id, "questionId", "acceptedAnswers", "updatedAt") VALUES ($1,$2,$3,NOW()) ON CONFLICT (id) DO NOTHING', [`${id}-key`, id, [answer]]);
  }
  await client.query('COMMIT');
  console.log(`Demo data ready. Sign in as ${email}. Existing demo passwords are not reset.`);
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  await client.end();
}
