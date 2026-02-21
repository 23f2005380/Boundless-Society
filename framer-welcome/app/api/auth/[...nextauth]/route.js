import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
// ... other imports

export const authOptions = {
  providers: [
    // ... your providers
  ],
  // ... other options
  pages: {
    // OLD (INCORRECT):
    // signIn: "/admin", 

    // NEW (CORRECT):
    signIn: "/admin-login", // Points to app/(auth)/admin-login/page.js
  },
  // ...
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };