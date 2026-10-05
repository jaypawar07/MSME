// Loaded via `node --import` before any test file.
// All tests use a throwaway SQLite file so the dev database (prisma/dev.db) is never touched.
process.env.DATABASE_URL = "file:./test.db";
process.env.NODE_ENV = "test";

await import("./alias-loader.mjs");
