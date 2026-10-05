// Test stand-in for "next-auth": route handlers see whatever session the test sets.
//   setTestSession({ user: { id, email, name, role } })   or   setTestSession(null)
let currentSession = null;

export function setTestSession(session) {
  currentSession = session;
}

export async function getServerSession() {
  return currentSession;
}

export default function NextAuth() {
  throw new Error("NextAuth handler is not available in tests");
}
