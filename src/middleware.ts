import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/repos/:path*",
    "/contribute/:path*",
    "/history/:path*",
    "/settings/:path*",
    "/api/analyze/:path*",
    "/api/contribute/:path*",
    "/api/contributions/:path*",
    "/api/repos/:path*",
    "/api/repos/sync",
    "/api/settings/:path*",
    "/api/dashboard/:path*",
    "/api/user/:path*",
  ],
};
