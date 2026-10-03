import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Immediately bypass middleware for file uploads so large video bodies (MP4) are not buffered or truncated
  if (request.nextUrl.pathname.startsWith("/api/upload")) {
    return NextResponse.next();
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/upload (direct multipart file uploads)
     * - uploads (static uploaded videos and images)
     * - media files (.svg, .png, .jpg, .jpeg, .gif, .webp, .mp4, .webm)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/upload|uploads|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm)$).*)",
  ],
};
