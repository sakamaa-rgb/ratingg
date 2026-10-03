import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { registerUser } from "@/lib/users";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json(
      { success: false, error: "Email dan password harus diisi." },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { success: false, error: "Password minimal 6 karakter." },
      { status: 400 }
    );
  }

  const result = await registerUser(email, password);

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 409 }
    );
  }

  const cleanEmail = email.toLowerCase().trim();
  const cookieStore = await cookies();

  // 1. Auto-login immediately upon successful registration
  cookieStore.set("brutal_dev_session", "authenticated", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  cookieStore.set("brutal_user_role", "user", {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });

  cookieStore.set("brutal_user_email", cleanEmail, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({
    success: true,
    email: cleanEmail,
    role: "user",
    autoLoggedIn: true,
  });
}
