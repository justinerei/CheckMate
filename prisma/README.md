# Database setup

Create a new, empty PostgreSQL database for CheckMate. Set `DATABASE_URL` in the ignored `.env.local` file to its connection string; see `.env.example`. Prisma uses the same Next.js environment-file loading rules as the app.

Run `npx prisma migrate deploy` to apply the committed migrations. Run `npx prisma migrate status` to check their status. Use `npx prisma validate` to validate the schema without connecting to the database.

This schema provides data structures and database constraints. Authorization, student-code sharing, question and rubric locking, answer-key auditing, and automatic score recalculation still require application logic. Never run reset commands on a database containing data you want to keep.
