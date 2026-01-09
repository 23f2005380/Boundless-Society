import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcrypt"

export const authOptions = {
  providers: [
    Credentials({
      name: "Admin Login",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {

        const adminUser = {
          username: process.env.ADMIN_USER,
          passwordHash: process.env.ADMIN_PASS_HASH
        }

        if (!credentials) return null

        const validUser = credentials.username === adminUser.username
        const validPass = bcrypt.compare(credentials.password, adminUser.passwordHash)

        if (!validUser || !validPass) return null

        return { id: "admin", name: "Administrator", role: "admin" }
      }
    })
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/admin"
  },
  secret: process.env.AUTH_SECRET
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }