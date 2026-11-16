import { randomUUID } from 'node:crypto';
import nextEnv from '@next/env';
import pg from 'pg';
import { hashPassword, validRegistration } from '../src/lib/password-auth.ts';

nextEnv.loadEnvConfig(process.cwd());
const email = 'admin@checkmate.test';
const password = process.env.CHECKMATE_DEMO_ADMIN_PASSWORD ?? '';
if (process.env.NODE_ENV === 'production') throw new Error('The demo admin seeder cannot run in production.');
if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL before running the seeder.');
const database = new URL(process.env.DATABASE_URL);
if (!['localhost', '127.0.0.1', '[::1]'].includes(database.hostname)) throw new Error('The demo admin seeder only runs against a local database.');
if (!validRegistration('Demo Admin', email, password)) throw new Error('Set CHECKMATE_DEMO_ADMIN_PASSWORD to a password of 12–128 characters.');
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  const existing = await client.query('SELECT role FROM "User" WHERE lower(email) = $1', [email]);
  if (existing.rowCount) {
    if (existing.rows[0].role !== 'ADMIN') throw new Error('That demo email belongs to a non-admin account; no changes were made.');
    console.log('The demo admin already exists. Its password was not changed.');
  } else {
    const passwordHash = await hashPassword(password);
    await client.query('INSERT INTO "User" (id, "googleId", email, name, role, "passwordHash", "updatedAt") VALUES ($1,$2,$3,$4,$5,$6,NOW())', [randomUUID(), `local:${randomUUID()}`, email, 'Demo Admin', 'ADMIN', passwordHash]);
    console.log(`Demo admin ready. Sign in as ${email} using the password you chose.`);
  }
} finally {
  await client.end();
}
