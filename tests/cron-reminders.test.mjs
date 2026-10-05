import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { subDays } from "date-fns";
import { resetTestDatabase } from "./helpers/test-db.mjs";

/**
 * The daily cron endpoint sends due reminders for every supplier, and only when
 * called with the CRON_SECRET (Vercel sends it as "Authorization: Bearer <secret>").
 */
describe("Cron - daily automatic reminders", () => {
  let prisma, cronRoute, handleCronReminders;
  const SECRET = "test-cron-secret-0123456789";
  const ACTIVE_HOURS = new Date("2024-06-01T06:00:00Z"); // 11:30 IST
  const QUIET_HOURS = new Date("2024-06-01T16:00:00Z"); // 21:30 IST
  const request = (authorization) =>
    new Request("http://test.local/api/cron/reminders", { headers: authorization ? { authorization } : {} });
  const call = (authorization, now = ACTIVE_HOURS) => handleCronReminders(request(authorization), now);

  before(async () => {
    resetTestDatabase();
    ({ prisma } = await import("../src/lib/prisma.ts"));
    cronRoute = await import("../src/app/api/cron/reminders/route.ts");
    ({ handleCronReminders } = await import("../src/lib/reminders/cron.ts"));

    // Two suppliers, each with an invoice 5 days past due (Day 1 reminder due)
    for (const label of ["one", "two"]) {
      const user = await prisma.user.create({ data: { email: `${label}@supplier.test`, name: label, passwordHash: "x" } });
      await prisma.invoice.create({
        data: {
          userId: user.id,
          buyerName: "Buyer Co",
          buyerEmail: `ap-${label}@buyer.test`,
          invoiceNumber: `INV-${label}`,
          amount: 100000,
          invoiceDate: subDays(ACTIVE_HOURS, 50),
          paymentTermsDays: 45,
        },
      });
    }
  });

  after(async () => {
    delete process.env.CRON_SECRET;
    await prisma?.$disconnect();
  });

  test("Refuses to run when CRON_SECRET is not configured", async () => {
    delete process.env.CRON_SECRET;
    assert.equal((await call(`Bearer ${SECRET}`)).status, 503);
    assert.equal(await prisma.reminder.count(), 0);
  });

  test("Rejects missing or wrong credentials", async () => {
    process.env.CRON_SECRET = SECRET;
    assert.equal((await call(undefined)).status, 401);
    assert.equal((await call("Bearer wrong")).status, 401);
    assert.equal((await call(SECRET)).status, 401, "Secret without the Bearer scheme is rejected");
    assert.equal(await prisma.reminder.count(), 0);
  });

  test("During quiet hours (IST), reminders are held back for every supplier", async () => {
    process.env.CRON_SECRET = SECRET;
    const body = await (await call(`Bearer ${SECRET}`, QUIET_HOURS)).json();
    assert.deepEqual({ dispatched: body.dispatched, heldForQuietHours: body.heldForQuietHours }, { dispatched: 0, heldForQuietHours: 2 });
    assert.equal(await prisma.reminder.count(), 0);
  });

  test("With the secret, sends due reminders for every supplier without leaking buyer contacts", async () => {
    process.env.CRON_SECRET = SECRET;
    const res = await call(`Bearer ${SECRET}`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.dispatched, 2);
    assert.equal(await prisma.reminder.count(), 2);
    assert.ok(!JSON.stringify(body).includes("@buyer.test"), "Response must not expose buyer contact details");
  });

  test("The deployed route is wired to the handler", async () => {
    delete process.env.CRON_SECRET;
    assert.equal((await cronRoute.GET(request(`Bearer ${SECRET}`))).status, 503);
    assert.equal(cronRoute.dynamic, "force-dynamic");
  });

  test("vercel.json schedules the endpoint daily at 09:00 IST (03:30 UTC)", () => {
    const config = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
    assert.deepEqual(config.crons, [{ path: "/api/cron/reminders", schedule: "30 3 * * *" }]);
  });
});

test("Cron schedule and the Settings send window agree (Hobby plan fires anytime within the UTC hour)", async () => {
  const { AUTO_SEND_WINDOW_IST, istTimeHHMM } = await import("../src/lib/settings/policy.ts");
  const config = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
  const [minute, hour] = config.crons[0].schedule.split(" ").map(Number);
  // Earliest possible run: start of the UTC hour; latest: end of that hour (Hobby) — Pro runs at the exact minute, inside both.
  const earliest = istTimeHHMM(new Date(Date.UTC(2024, 0, 1, hour, 0)));
  const latestExclusive = istTimeHHMM(new Date(Date.UTC(2024, 0, 1, hour + 1, 0)));
  const exact = istTimeHHMM(new Date(Date.UTC(2024, 0, 1, hour, minute)));
  assert.equal(AUTO_SEND_WINDOW_IST.start, earliest);
  assert.equal(AUTO_SEND_WINDOW_IST.end, latestExclusive);
  assert.ok(exact >= earliest && exact < latestExclusive);
});
