import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateLogin } from "@/lib/users";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json(
      { success: false, error: "Email dan password harus diisi." },
      { status: 400 }
    );
  }

  const user = validateLogin(email, password);

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Email atau password salah." },
      { status: 401 }
    );
  }

  const cookieStore = await cookies();

  cookieStore.set("brutal_dev_session", "authenticated", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  cookieStore.set("brutal_user_role", user.role, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });

  cookieStore.set("brutal_user_email", user.email, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({
    success: true,
    email: user.email,
    role: user.role,
  });
}
