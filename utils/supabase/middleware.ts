import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isAuthCallback = pathname.startsWith("/auth");
  const isApiRoute = pathname.startsWith("/api");
  const isAdminPage = pathname.startsWith("/admin");
  const isAuthenticated = request.cookies.get("brutal_dev_session")?.value === "authenticated";
  const userRole = request.cookies.get("brutal_user_role")?.value;

  // 1. Mandatory Login Gate: Unauthenticated users are redirected to /login first
  if (!isAuthenticated && !isAuthPage && !isAuthCallback && !isApiRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    if (pathname !== "/") {
      url.searchParams.set("redirectedFrom", pathname);
    }
    return NextResponse.redirect(url);
  }

  // 2. Protect admin routes: STRICTLY ADMIN ONLY (Regular users redirected to home)
  if (isAdminPage) {
    if (!isAuthenticated) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirectedFrom", pathname);
      return NextResponse.redirect(url);
    }

    const userEmail = request.cookies.get("brutal_user_email")?.value?.toLowerCase().trim() || "";
    const adminEmail = (process.env.ADMIN_EMAIL || "adminflix123@gmail.com").toLowerCase().trim();
    const isAdmin =
      userEmail === "rajibjugi02@gmail.com" ||
      userEmail === adminEmail;

    if (!isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  // 3. If already authenticated and trying to visit login/register, redirect to destination
  if (isAuthenticated && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = userRole === "admin" ? "/admin" : "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
