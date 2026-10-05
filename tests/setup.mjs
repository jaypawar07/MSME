// Loaded via `node --import` before any test file.
// All tests use a throwaway SQLite file so the dev database (prisma/dev.db) is never touched.
process.env.DATABASE_URL = "file:./test.db";
process.env.NODE_ENV = "test";

// Never deliver real email/WhatsApp from tests: without credentials the senders only log.
for (const key of ["RESEND_API_KEY", "SMTP_HOST", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_ACCESS_TOKEN"]) {
  delete process.env[key];
}

await import("./alias-loader.mjs");
