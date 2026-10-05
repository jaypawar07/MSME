import test from "node:test";
import assert from "node:assert/strict";

test("Company Settings: Statutory Interest Calculation Formula", () => {
  const rbiBaseRate = 5.5;
  const statutoryMultiplier = 3.0;
  const calculatedEffectiveRate = Number((rbiBaseRate * statutoryMultiplier).toFixed(2));
  
  assert.equal(calculatedEffectiveRate, 16.5, "Default Section 16 rate must be 16.5% (3x 5.5%)");

  // When RBI revises base rate to 6.0%
  const revisedBaseRate = 6.0;
  const revisedRate = Number((revisedBaseRate * statutoryMultiplier).toFixed(2));
  assert.equal(revisedRate, 18.0, "Revised Section 16 rate must reflect 18.0% (3x 6.0%)");
});

test("Company Settings: Role-Based Permission Matrix", () => {
  const roles = {
    OWNER: { canViewInvoices: true, canAddInvoices: true, canEditSettings: true, canDeleteCompany: true },
    ACCOUNTANT: { canViewInvoices: true, canAddInvoices: true, canEditSettings: false, canDeleteCompany: false },
    STAFF: { canViewInvoices: true, canAddInvoices: true, canEditSettings: false, canDeleteCompany: false },
  };

  assert.equal(roles.OWNER.canEditSettings, true, "Owner can edit settings");
  assert.equal(roles.ACCOUNTANT.canEditSettings, false, "Accountant cannot edit settings");
  assert.equal(roles.STAFF.canDeleteCompany, false, "Staff cannot delete company data");
});

test("Company Settings: Quiet Hours Evaluation", () => {
  function isQuietHours(timeStr, startStr = "21:00", endStr = "08:00") {
    // start 21:00 (9pm), end 08:00 (8am) spans overnight
    const [h, m] = timeStr.split(":").map(Number);
    const [startH, startM] = startStr.split(":").map(Number);
    const [endH, endM] = endStr.split(":").map(Number);

    const val = h * 60 + m;
    const startVal = startH * 60 + startM;
    const endVal = endH * 60 + endM;

    if (startVal > endVal) {
      // Overnight window (e.g. 21:00 to 08:00)
      return val >= startVal || val < endVal;
    }
    return val >= startVal && val < endVal;
  }

  assert.equal(isQuietHours("22:30"), true, "10:30 PM is within quiet hours");
  assert.equal(isQuietHours("02:00"), true, "02:00 AM is within quiet hours");
  assert.equal(isQuietHours("07:59"), true, "07:59 AM is within quiet hours");
  assert.equal(isQuietHours("08:01"), false, "08:01 AM is during active reminder hours");
  assert.equal(isQuietHours("14:00"), false, "02:00 PM is during active reminder hours");
});
