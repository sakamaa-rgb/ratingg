import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Legacy endpoint kept for backward compatibility — sets session cookies directly
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const body = await request.json().catch(() => ({}));
  const email = body.email || "user@ratezero.dev";
  const role = body.role || "user";

  cookieStore.set("brutal_dev_session", "authenticated", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });

  cookieStore.set("brutal_user_role", role, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });

  cookieStore.set("brutal_user_email", email, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ success: true, email, role });
}
