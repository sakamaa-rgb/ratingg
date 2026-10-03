import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  
  // Clear all auth cookies
  cookieStore.delete("brutal_dev_session");
  cookieStore.delete("brutal_user_role");
  cookieStore.delete("brutal_user_email");

  return NextResponse.json({ success: true });
}
