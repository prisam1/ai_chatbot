import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Guards /chat on the server and keeps signed-in users out of the auth pages
export default withAuth(
  function middleware(req) {
    if (req.nextUrl.pathname.startsWith("/auth") && req.nextauth.token) {
      return NextResponse.redirect(new URL("/chat", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ req, token }) => req.nextUrl.pathname.startsWith("/auth") || !!token,
    },
    pages: { signIn: "/auth/login" },
  }
);

export const config = {
  matcher: ["/chat/:path*", "/auth/:path*"],
};
