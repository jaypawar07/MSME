/**
 * Company settings rules shared by the API routes, the reminder scheduler and tests:
 * Section 16 rate derivation, quiet hours, and role permissions.
 */

export type UserRole = "OWNER" | "ACCOUNTANT" | "STAFF" | "ADMIN";

export type Permission = "editSettings" | "manageTeam" | "deleteCompany";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  OWNER: ["editSettings", "manageTeam", "deleteCompany"],
  ADMIN: ["editSettings", "manageTeam", "deleteCompany"],
  ACCOUNTANT: [],
  STAFF: [],
};

/** Sessions issued before roles were added to the JWT carry no role; they belong to account owners. */
export function normalizeRole(role: unknown): UserRole {
  return typeof role === "string" && role in ROLE_PERMISSIONS ? (role as UserRole) : "OWNER";
}

export function can(role: unknown, permission: Permission): boolean {
  return ROLE_PERMISSIONS[normalizeRole(role)].includes(permission);
}

export const RATE_LIMITS = {
  rbiBaseRate: { min: 0.01, max: 25 },
  statutoryMultiplier: { min: 1, max: 5 },
};

/** Section 16: compound interest at three times the RBI Bank Rate. */
export function computeEffectiveRate(rbiBaseRate: number, statutoryMultiplier: number): number {
  return Number((rbiBaseRate * statutoryMultiplier).toFixed(2));
}

export function isValidRate(value: unknown, limits: { min: number; max: number }): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= limits.min && value <= limits.max;
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidTimeHHMM(value: unknown): value is string {
  return typeof value === "string" && HHMM.test(value);
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** True when `time` (HH:MM) falls inside the quiet window, which may span midnight. */
export function isQuietHours(time: string, start = "21:00", end = "08:00"): boolean {
  const t = toMinutes(time);
  const s = toMinutes(start);
  const e = toMinutes(end);
  if (s === e) return false;
  return s > e ? t >= s || t < e : t >= s && t < e;
}

/** Current wall-clock time in India as HH:MM, independent of the server's timezone. */
export function istTimeHHMM(date: Date = new Date()): string {
  const ist = new Date(date.getTime() + (5 * 60 + 30) * 60 * 1000);
  return `${String(ist.getUTCHours()).padStart(2, "0")}:${String(ist.getUTCMinutes()).padStart(2, "0")}`;
}
