import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASS_HASH

const handler = NextAuth({
  session: {
    strategy: "jwt",
  },

  providers: [
    Credentials({
      name: "Admin Login",
      credentials: {
        email: {},
        password: {},
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        if (credentials.email !== ADMIN_EMAIL) {
          return null
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          ADMIN_PASSWORD_HASH
        )

        if (!isValid) return null

        return {
          id: "1",
          email: ADMIN_EMAIL,
          role: "admin",
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role
      }
      return session
    },
  },

  pages: {
    signIn: "/admin-login",
  },

  secret: process.env.AUTH_SECRET,
})

export { handler as GET, handler as POST }