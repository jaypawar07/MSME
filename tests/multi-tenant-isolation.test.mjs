import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { setTestSession } from "./stubs/next-auth.mjs";
import { resetTestDatabase } from "./helpers/test-db.mjs";

/**
 * Multi-tenant security audit against the real API route handlers and a real
 * (throwaway) SQLite database: supplier B must never read, change or act on
 * supplier A's invoices.
 */

describe("Multi-Tenant Isolation - real API routes", () => {
let prisma, invoicesRoute, invoiceRoute, remindersRoute, disputeRoute, leadsRoute;
let userA, userB, invoiceOfA;

const asUser = (user) => setTestSession({ user: { id: user.id, email: user.email, name: user.name, role: "OWNER" } });
const params = (id) => ({ params: { id } });
const json = (body) => new Request("http://test.local/api", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
const get = () => new Request("http://test.local/api");

before(async () => {
  resetTestDatabase();
  ({ prisma } = await import("../src/lib/prisma.ts"));
  invoicesRoute = await import("../src/app/api/invoices/route.ts");
  invoiceRoute = await import("../src/app/api/invoices/[id]/route.ts");
  remindersRoute = await import("../src/app/api/invoices/[id]/reminders/route.ts");
  disputeRoute = await import("../src/app/api/invoices/[id]/dispute-package/route.ts");
  leadsRoute = await import("../src/app/api/financing/leads/route.ts");

  userA = await prisma.user.create({ data: { email: "a@supplier.test", name: "Supplier A", passwordHash: "x" } });
  userB = await prisma.user.create({ data: { email: "b@supplier.test", name: "Supplier B", passwordHash: "x" } });

  asUser(userA);
  const res = await invoicesRoute.POST(json({
    buyerName: "Buyer Alpha",
    buyerEmail: "ap@alpha.test",
    invoiceNumber: "INV-A-101",
    amount: 500000,
    invoiceDate: "2024-01-01",
    paymentTermsDays: 45,
  }));
  assert.ok(res.status < 300, `Supplier A should be able to create an invoice (got ${res.status})`);
  invoiceOfA = await prisma.invoice.findFirstOrThrow({ where: { invoiceNumber: "INV-A-101" } });
});

after(async () => {
  setTestSession(null);
  await prisma?.$disconnect();
});

test("Multi-Tenant Isolation - Unauthenticated requests are rejected", async () => {
  setTestSession(null);
  assert.equal((await invoicesRoute.GET(get())).status, 401);
  assert.equal((await invoiceRoute.GET(get(), params(invoiceOfA.id))).status, 401);
});

test("Multi-Tenant Isolation - Owner can read their own invoice", async () => {
  asUser(userA);
  assert.equal((await invoiceRoute.GET(get(), params(invoiceOfA.id))).status, 200);
  const list = JSON.stringify(await (await invoicesRoute.GET(get())).json());
  assert.ok(list.includes("INV-A-101"));
});

test("Multi-Tenant Isolation - User B's invoice list excludes User A's invoices", async () => {
  asUser(userB);
  const list = JSON.stringify(await (await invoicesRoute.GET(get())).json());
  assert.ok(!list.includes("INV-A-101"), "Supplier B must not see Supplier A's invoice");
});

test("Multi-Tenant Isolation - User B cannot read, update, or delete User A's invoice", async () => {
  asUser(userB);
  assert.equal((await invoiceRoute.GET(get(), params(invoiceOfA.id))).status, 404);

  const patch = new Request("http://test.local/api", { method: "PATCH", body: JSON.stringify({ status: "PAID", amount: 1 }) });
  assert.equal((await invoiceRoute.PATCH(patch, params(invoiceOfA.id))).status, 404);

  assert.equal((await invoiceRoute.DELETE(get(), params(invoiceOfA.id))).status, 404);

  const stored = await prisma.invoice.findUnique({ where: { id: invoiceOfA.id } });
  assert.equal(stored.status, "PENDING", "Invoice must be unchanged");
  assert.equal(stored.amount, 500000, "Invoice must be unchanged");
});

test("Multi-Tenant Isolation - User B cannot read or send reminders on User A's invoice", async () => {
  asUser(userB);
  assert.equal((await remindersRoute.GET(get(), params(invoiceOfA.id))).status, 404);
  const res = await remindersRoute.POST(json({ channel: "EMAIL", tone: "FORMAL", message: "Pay now" }), params(invoiceOfA.id));
  assert.equal(res.status, 404);
  assert.equal(await prisma.reminder.count({ where: { invoiceId: invoiceOfA.id } }), 0);
});

test("Multi-Tenant Isolation - User B cannot generate a dispute package for User A's invoice", async () => {
  asUser(userB);
  assert.equal((await disputeRoute.GET(get(), params(invoiceOfA.id))).status, 404);
});

test("Multi-Tenant Isolation - User B cannot raise financing against User A's invoice", async () => {
  asUser(userB);
  const res = await leadsRoute.POST(json({
    invoiceId: invoiceOfA.id,
    contactName: "Mallory",
    contactPhone: "9999999999",
    contactEmail: "m@b.test",
    requestedAmount: 400000,
    consentGiven: true,
  }));
  assert.equal(res.status, 404);
  assert.equal(await prisma.financingLead.count(), 0);
});
});
