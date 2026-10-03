import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isAdminPage = pathname.startsWith("/admin");
  const isAuthenticated = request.cookies.get("brutal_dev_session")?.value === "authenticated";
  const userRole = request.cookies.get("brutal_user_role")?.value;

  // Protect admin routes: only authenticated users (preferably admin role) can access
  if (isAdminPage) {
    if (!isAuthenticated) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirectedFrom", pathname);
      return NextResponse.redirect(url);
    }
  }

  // If already authenticated and trying to visit login/register, redirect to appropriate page
  if (isAuthenticated && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = userRole === "admin" ? "/admin" : "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
