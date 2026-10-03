import { NextResponse } from "next/server";
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

  const result = registerUser(email, password);

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 409 }
    );
  }

  return NextResponse.json({ success: true });
}
