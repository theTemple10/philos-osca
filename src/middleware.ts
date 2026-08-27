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
    "/settings/:path*",
    "/api/analyze/:path*",
    "/api/contribute/:path*",
    "/api/contributions/:path*",
    "/api/repos/:path*",
    "/api/settings/:path*",
  ],
};
