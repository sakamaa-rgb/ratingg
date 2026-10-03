import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const devSession = cookieStore.get("brutal_dev_session")?.value;
  const devRole = cookieStore.get("brutal_user_role")?.value || "user";
  const devEmail = cookieStore.get("brutal_user_email")?.value || "";

  if (devSession === "authenticated" && devEmail) {
    return NextResponse.json({
      authenticated: true,
      email: devEmail,
      role: devRole,
    });
  }

  return NextResponse.json({ authenticated: false });
}
