// Test stand-in for "next-auth/providers/credentials" (only its config object is used by src/lib/auth.ts).
export default function CredentialsProvider(options) {
  return { id: "credentials", type: "credentials", ...options };
}
