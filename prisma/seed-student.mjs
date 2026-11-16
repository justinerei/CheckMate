import nextEnv from '@next/env';
import pg from 'pg';
import { hashPassword, validRegistration } from '../src/lib/password-auth.ts';

nextEnv.loadEnvConfig(process.cwd());
const email = 'student@checkmate.test';
const password = process.env.CHECKMATE_DEMO_STUDENT_PASSWORD ?? '';
if (process.env.NODE_ENV === 'production') throw new Error('The demo student seeder cannot run in production.');
if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL before running the seeder.');
const database = new URL(process.env.DATABASE_URL);
if (!['localhost', '127.0.0.1', '[::1]'].includes(database.hostname)) throw new Error('The demo student seeder only runs against a local database.');
if (!validRegistration('Alex Rivera', email, password)) throw new Error('Set CHECKMATE_DEMO_STUDENT_PASSWORD to a password of 12–128 characters.');
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
const prefix = 'checkmate-sample-student';
const quizzes = [
  { title: 'Science Quiz', questions: [['What planet is known as the Red Planet?', 'Mars'], ['What do plants absorb from the air?', 'Carbon dioxide'], ['Which organ pumps blood?', 'Heart']] },
  { title: 'English Quiz', questions: [['What is the past tense of walk?', 'Walked'], ['What punctuation ends a question?', 'Question mark'], ['What is the plural of child?', 'Children']] },
  { title: 'Math Quiz', questions: [['What is 4 + 5?', '9'], ['What is 3 × 4?', '12'], ['What is half of 10?', '5']] },
];
await client.connect();
try {
  await client.query('BEGIN');
  const collision = await client.query('SELECT id FROM "User" WHERE lower(email) = $1 OR id = ANY($2::text[]) OR "googleId" = ANY($3::text[])', [email, [`${prefix}-account`, `${prefix}-teacher`], [`local:${prefix}-account`, `local:${prefix}-teacher`]]);
  if (collision.rowCount) {
    if (collision.rows.length === 2 && collision.rows.some(row => row.id === `${prefix}-account`) && collision.rows.some(row => row.id === `${prefix}-teacher`)) {
      await client.query('ROLLBACK');
      console.log('The demo student already exists. Existing data and password were not changed.');
    } else throw new Error('The sample account or reserved demo identifiers already exist; no changes were made.');
  } else {
    await client.query('INSERT INTO "User" (id,"googleId",email,name,role,"passwordHash","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,NOW())', [`${prefix}-account`, `local:${prefix}-account`, email, 'Alex Rivera', 'STUDENT', await hashPassword(password)]);
    await client.query('INSERT INTO "User" (id,"googleId",email,name,role,enabled,"updatedAt") VALUES ($1,$2,$3,$4,$5,false,NOW())', [`${prefix}-teacher`, `local:${prefix}-teacher`, 'student-demo-teacher@checkmate.test', 'Sample Teacher', 'TEACHER']);
    await client.query('INSERT INTO "Student" (id,code,name,"accountId","updatedAt") VALUES ($1,$2,$3,$4,NOW())', [`${prefix}-record`, 'CM-SAMPLE-STUDENT-LOCAL-DEMO', 'Alex Rivera', `${prefix}-account`]);
    await client.query('INSERT INTO "TeacherStudent" ("teacherId","studentId") VALUES ($1,$2)', [`${prefix}-teacher`, `${prefix}-record`]);
    for (const [index, quiz] of quizzes.entries()) {
      const quizId = `${prefix}-quiz-${index + 1}`; const sectionId = `${quizId}-section`; const paperId = `${quizId}-paper`; const score = index === 1 ? 2 : 3;
      await client.query('INSERT INTO "Quiz" (id,"teacherId",title,"updatedAt") VALUES ($1,$2,$3,NOW())', [quizId, `${prefix}-teacher`, quiz.title]);
      await client.query('INSERT INTO "QuizSection" (id,"quizId",title,position) VALUES ($1,$2,$3,1)', [sectionId, quizId, 'Identification']);
      await client.query('INSERT INTO "Submission" (id,"quizId","studentId","teacherId",status,"objectiveScore","essayScore","totalScore","finalizedAt","releasedAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,0,$6,NOW(),NOW(),NOW())', [paperId, quizId, `${prefix}-record`, `${prefix}-teacher`, 'FINALIZED', score]);
      for (const [position, [text, answer]] of quiz.questions.entries()) {
        const questionId = `${quizId}-question-${position + 1}`; const correct = !(index === 1 && position === 2);
        await client.query('INSERT INTO "Question" (id,"sectionId",type,text,position,points) VALUES ($1,$2,$3,$4,$5,1)', [questionId, sectionId, 'IDENTIFICATION', text, position + 1]);
        await client.query('INSERT INTO "AnswerKey" (id,"questionId","acceptedAnswers","updatedAt") VALUES ($1,$2,$3,NOW())', [`${questionId}-key`, questionId, [answer]]);
        await client.query('INSERT INTO "SubmissionAnswer" (id,"submissionId","questionId","confirmedText","reviewStatus","objectiveScore") VALUES ($1,$2,$3,$4,$5,$6)', [`${questionId}-answer`, paperId, questionId, correct ? answer : 'Childs', 'CONFIRMED', correct ? 1 : 0]);
      }
    }
    await client.query('COMMIT');
    console.log(`Demo student ready. Sign in as ${email} using the password you chose.`);
  }
} catch (error) { await client.query('ROLLBACK'); throw error; }
finally { await client.end(); }
