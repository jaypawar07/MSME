import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { setTestSession } from "./stubs/next-auth.mjs";
import { resetTestDatabase } from "./helpers/test-db.mjs";

describe("Settings API - quiet hours vs the daily send window", () => {
  let prisma, settingsRoute, user;
  const patch = (body) =>
    settingsRoute.PATCH(new Request("http://test.local/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }));

  before(async () => {
    resetTestDatabase();
    ({ prisma } = await import("../src/lib/prisma.ts"));
    settingsRoute = await import("../src/app/api/settings/route.ts");
    user = await prisma.user.create({ data: { email: "owner@supplier.test", name: "Owner", passwordHash: "x" } });
    setTestSession({ user: { id: user.id, email: user.email, name: user.name, role: "OWNER" } });
  });

  after(async () => {
    setTestSession(null);
    await prisma?.$disconnect();
  });

  test("Rejects quiet hours that would block every automatic reminder", async () => {
    const res = await patch({ quietHoursStart: "21:00", quietHoursEnd: "09:00" });
    assert.equal(res.status, 400);
    assert.match((await res.json()).error, /08:30.*09:30 IST/);
    assert.equal(await prisma.companySettings.count({ where: { userId: user.id } }), 0, "Nothing saved");
  });

  test("Also checks a change to only one end against the saved other end", async () => {
    assert.equal((await patch({ quietHoursStart: "22:00", quietHoursEnd: "08:00" })).status, 200);
    assert.equal((await patch({ quietHoursEnd: "10:00" })).status, 400);
    const saved = await prisma.companySettings.findUnique({ where: { userId: user.id } });
    assert.deepEqual([saved.quietHoursStart, saved.quietHoursEnd], ["22:00", "08:00"]);
  });

  test("GET flags previously saved quiet hours that block automatic reminders", async () => {
    await prisma.companySettings.update({ where: { userId: user.id }, data: { quietHoursEnd: "09:15" } });
    const body = await (await settingsRoute.GET(new Request("http://test.local/api/settings"))).json();
    assert.match(body.quietHoursWarning, /08:30.*09:30 IST/);
    await prisma.companySettings.update({ where: { userId: user.id }, data: { quietHoursEnd: "08:00" } });
    const ok = await (await settingsRoute.GET(new Request("http://test.local/api/settings"))).json();
    assert.equal(ok.quietHoursWarning, null);
  });
});

describe("Roles - legacy or unknown stored roles", () => {
  test("Login session turns a legacy 'USER' role into OWNER (existing sessions too)", async () => {
    const { authOptions } = await import("../src/lib/auth.ts");
    const token = await authOptions.callbacks.jwt({ token: {}, user: { id: "u1", role: "USER" } });
    assert.equal(token.role, "OWNER");
    const session = await authOptions.callbacks.session({ session: { user: {} }, token: { id: "u1", role: "USER" } });
    assert.equal(session.user.role, "OWNER", "A session issued before the fix is corrected too");
    const staff = await authOptions.callbacks.session({ session: { user: {} }, token: { id: "u2", role: "STAFF" } });
    assert.equal(staff.user.role, "STAFF", "Valid roles are kept");
  });

  test("Settings page is told the normalized role, so Save is enabled for owners", async () => {
    resetTestDatabase();
    const { prisma } = await import("../src/lib/prisma.ts");
    const settingsRoute = await import("../src/app/api/settings/route.ts");
    const user = await prisma.user.create({ data: { email: "legacy@supplier.test", name: "Legacy", passwordHash: "x", role: "USER" } });
    setTestSession({ user: { id: user.id, email: user.email, name: user.name, role: "USER" } });
    const body = await (await settingsRoute.GET(new Request("http://test.local/api/settings"))).json();
    assert.equal(body.currentUserRole, "OWNER");
    setTestSession(null);
  });
});
