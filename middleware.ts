import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Map of path prefixes → required permission (super-admin bypasses all)
const ROUTE_PERMISSIONS: [string, string][] = [
  ["/admin/users", "users:manage"],
  ["/admin/roles", "roles:manage"],
  ["/admin/settings", "settings:manage"],
  ["/admin/logs", "logs:read"],
  ["/admin/seo", "seo:manage"],
  ["/admin/scraping", "scraping:manage"],
  ["/admin/ai", "ai:generate"],
  ["/admin/media", "media:read"],
  ["/admin/articles", "articles:read"],
  ["/admin/categories", "categories:manage"],
  ["/admin/tags", "tags:manage"],
  ["/admin/authors", "authors:manage"],
  ["/admin/pages", "pages:manage"],
  ["/admin/providers", "providers:manage"],
  ["/admin/licenses", "licenses:manage"],
  ["/admin/partners", "partners:manage"],
];

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const role = token?.role as string | undefined;
    const permissions = (token?.permissions as string[]) ?? [];
    const path = req.nextUrl.pathname;

    if (role === "super-admin") return NextResponse.next();

    for (const [prefix, required] of ROUTE_PERMISSIONS) {
      if (path.startsWith(prefix)) {
        if (!permissions.includes(required)) {
          return NextResponse.redirect(new URL("/admin/dashboard", req.url));
        }
        break;
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/admin/:path*"],
};
