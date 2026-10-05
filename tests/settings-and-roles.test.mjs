import test from "node:test";
import assert from "node:assert/strict";
import {
  can,
  normalizeRole,
  computeEffectiveRate,
  isValidRate,
  RATE_LIMITS,
  isValidTimeHHMM,
  isQuietHours,
  istTimeHHMM,
  AUTO_SEND_WINDOW_IST,
  quietHoursBlockAutoSend,
} from "../src/lib/settings/policy.ts";

test("Company Settings: Statutory Interest Calculation Formula", () => {
  assert.equal(computeEffectiveRate(5.5, 3), 16.5, "Default Section 16 rate must be 16.5% (3x 5.5%)");
  assert.equal(computeEffectiveRate(6.0, 3), 18.0, "Revised Section 16 rate must reflect 18.0% (3x 6.0%)");
  assert.equal(computeEffectiveRate(6.25, 3), 18.75);
});

test("Company Settings: Rate validation rejects nonsense values", () => {
  assert.equal(isValidRate(5.5, RATE_LIMITS.rbiBaseRate), true);
  for (const bad of [0, -1, 26, NaN, Infinity, "5.5", null]) {
    assert.equal(isValidRate(bad, RATE_LIMITS.rbiBaseRate), false, `rbiBaseRate ${bad} should be rejected`);
  }
  assert.equal(isValidRate(3, RATE_LIMITS.statutoryMultiplier), true);
  assert.equal(isValidRate(0.5, RATE_LIMITS.statutoryMultiplier), false);
});

test("Company Settings: Role-Based Permission Matrix", () => {
  assert.equal(can("OWNER", "editSettings"), true, "Owner can edit settings");
  assert.equal(can("OWNER", "manageTeam"), true);
  assert.equal(can("ADMIN", "deleteCompany"), true);
  assert.equal(can("ACCOUNTANT", "editSettings"), false, "Accountant cannot edit settings");
  assert.equal(can("ACCOUNTANT", "manageTeam"), false);
  assert.equal(can("STAFF", "editSettings"), false);
  assert.equal(can("STAFF", "deleteCompany"), false, "Staff cannot delete company data");
});

test("Company Settings: Sessions without a role are treated as account owners", () => {
  assert.equal(normalizeRole(undefined), "OWNER");
  assert.equal(normalizeRole("SUPERUSER"), "OWNER");
  assert.equal(normalizeRole("STAFF"), "STAFF");
});

test("Company Settings: Quiet Hours Evaluation", () => {
  assert.equal(isQuietHours("22:30"), true, "10:30 PM is within quiet hours");
  assert.equal(isQuietHours("02:00"), true, "02:00 AM is within quiet hours");
  assert.equal(isQuietHours("07:59"), true, "07:59 AM is within quiet hours");
  assert.equal(isQuietHours("08:00"), false, "End of window is exclusive");
  assert.equal(isQuietHours("14:00"), false, "02:00 PM is during active reminder hours");
  // Same-day window and disabled window
  assert.equal(isQuietHours("13:30", "13:00", "14:00"), true);
  assert.equal(isQuietHours("15:00", "13:00", "14:00"), false);
  assert.equal(isQuietHours("10:00", "09:00", "09:00"), false, "Equal start/end disables quiet hours");
});

test("Company Settings: Time format validation", () => {
  for (const ok of ["00:00", "08:00", "21:30", "23:59"]) assert.equal(isValidTimeHHMM(ok), true, ok);
  for (const bad of ["24:00", "8:00", "21:60", "9pm", "", null]) assert.equal(isValidTimeHHMM(bad), false, String(bad));
});

test("Company Settings: Quiet hours are evaluated in India time regardless of server timezone", () => {
  assert.equal(istTimeHHMM(new Date("2024-06-01T16:00:00Z")), "21:30");
  assert.equal(istTimeHHMM(new Date("2024-06-01T20:00:00Z")), "01:30");
});

test("Company Settings: Quiet hours may not cover the daily automatic-send window", () => {
  assert.deepEqual(AUTO_SEND_WINDOW_IST, { start: "08:30", end: "09:30" });
  assert.equal(quietHoursBlockAutoSend("21:00", "08:00"), false, "Default 9pm–8am is fine");
  assert.equal(quietHoursBlockAutoSend("21:00", "08:30"), false, "Ending exactly at 08:30 is fine");
  assert.equal(quietHoursBlockAutoSend("21:00", "08:31"), true, "One minute into the window is not");
  assert.equal(quietHoursBlockAutoSend("21:00", "09:00"), true);
  assert.equal(quietHoursBlockAutoSend("09:29", "10:00"), true, "Starting inside the window");
  assert.equal(quietHoursBlockAutoSend("09:30", "18:00"), false, "Starting when the window ends is fine");
  assert.equal(quietHoursBlockAutoSend("06:00", "12:00"), true, "Window fully inside quiet hours");
  assert.equal(quietHoursBlockAutoSend("09:00", "09:00"), false, "Equal start/end disables quiet hours");
});
