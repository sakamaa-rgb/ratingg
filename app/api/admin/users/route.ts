import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAllUsers, deleteStoredUser } from "@/lib/users";
import { createClient } from "@supabase/supabase-js";
import { getSanitizedSupabaseUrl, getSanitizedSupabaseKey } from "@/utils/supabase/url";

export const dynamic = "force-dynamic";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("brutal_dev_session")?.value;
  const role = cookieStore.get("brutal_user_role")?.value;
  return session === "authenticated" && role === "admin";
}

export async function GET() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const localUsers = getAllUsers();
  
  // Format for admin users page
  const formatted = localUsers.map((u, i) => ({
    id: `usr_${100 + i}`,
    email: u.email,
    role: u.role || "user",
    status: "active" as const,
    reviewsCount: Math.floor(Math.random() * 20),
    lastActive: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "Recently",
  }));

  return NextResponse.json({ success: true, users: formatted });
}

export async function DELETE(request: Request) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const adminEmail = (process.env.ADMIN_EMAIL || "adminflix123@gmail.com").toLowerCase();
  if (email.toLowerCase() === adminEmail) {
    return NextResponse.json(
      { error: "Admin utama tidak dapat dihapus." },
      { status: 400 }
    );
  }

  deleteStoredUser(email);

  return NextResponse.json({ success: true, deletedEmail: email });
}
