import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: "/admin"
  }
})

export const config = {
  matcher: ["/admin/:path*"]
}