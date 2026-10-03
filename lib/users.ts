import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { getSanitizedSupabaseUrl, getSanitizedSupabaseKey } from "@/utils/supabase/url";

export interface StoredUser {
  email: string;
  password?: string;
  role: "admin" | "user";
  createdAt: string;
}

const USERS_FILE = path.join(process.cwd(), "data", "users.json");

// In-memory fallback cache so serverless / cloud won't crash on read-only filesystem
let inMemoryUsers: StoredUser[] = [];

function getSupabaseClient() {
  const url = getSanitizedSupabaseUrl();
  const key = getSanitizedSupabaseKey();
  if (!url || !key || url.includes("placeholder-project")) {
    return null;
  }
  return createClient(url, key);
}

function ensureDataDir() {
  try {
    const dir = path.dirname(USERS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch {
    // Read-only filesystem (e.g. Vercel)
  }
}

export function getAllUsers(): StoredUser[] {
  const adminEmail = process.env.ADMIN_EMAIL || "adminflix123@gmail.com";
  const defaultAdmin: StoredUser = {
    email: adminEmail,
    role: "admin",
    createdAt: new Date().toISOString(),
  };

  try {
    ensureDataDir();
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, "utf-8");
      const diskUsers = JSON.parse(raw) as StoredUser[];
      return diskUsers.length > 0 ? diskUsers : [defaultAdmin, ...inMemoryUsers];
    }
  } catch {
    // Read-only filesystem
  }

  return inMemoryUsers.length > 0 ? inMemoryUsers : [defaultAdmin];
}

export async function validateLogin(
  email: string,
  password: string
): Promise<StoredUser | null> {
  const adminEmail = process.env.ADMIN_EMAIL || "adminflix123@gmail.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "adminflix123";

  // 1. Direct Admin Credential Check
  if (
    email.toLowerCase().trim() === adminEmail.toLowerCase().trim() &&
    password === adminPassword
  ) {
    return {
      email: adminEmail,
      role: "admin",
      createdAt: new Date().toISOString(),
    };
  }

  // 2. Supabase Auth Check (Cross-device cloud sync: Windows & Mobile)
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (!error && data.user) {
        const userEmail = data.user.email || email;
        const isAdmin =
          userEmail.toLowerCase().includes("admin") ||
          userEmail.toLowerCase().trim() === "rajibjugi02@gmail.com" ||
          userEmail.toLowerCase().trim() === adminEmail.toLowerCase().trim();

        return {
          email: userEmail,
          role: isAdmin ? "admin" : "user",
          createdAt: data.user.created_at || new Date().toISOString(),
        };
      }
    } catch (err) {
      console.warn("Supabase Auth signIn failed, falling back to local:", err);
    }
  }

  // 3. Fallback to local / in-memory list
  const users = getAllUsers();
  const localMatch = users.find(
    (u) =>
      u.email.toLowerCase() === email.toLowerCase().trim() &&
      u.password === password
  );

  if (localMatch) {
    const isAdmin =
      localMatch.email.toLowerCase().includes("admin") ||
      localMatch.email.toLowerCase().trim() === "rajibjugi02@gmail.com" ||
      localMatch.email.toLowerCase().trim() === adminEmail.toLowerCase().trim() ||
      localMatch.role === "admin";

    return {
      ...localMatch,
      role: isAdmin ? "admin" : "user",
    };
  }

  return null;
}

export async function registerUser(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const cleanEmail = email.toLowerCase().trim();
  const adminEmail = (process.env.ADMIN_EMAIL || "adminflix123@gmail.com").toLowerCase();

  if (cleanEmail === adminEmail) {
    return { success: false, error: "Email ini terdaftar sebagai Admin." };
  }

  // 1. Register with Supabase Cloud Auth (Available immediately across Windows & Mobile)
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("already registered") || msg.includes("unique") || error.status === 422) {
          return { success: false, error: "Email sudah terdaftar. Silakan login." };
        }
        if (msg.includes("rate limit")) {
          return { success: false, error: "Terlalu banyak permintaan. Silakan tunggu 1 menit lalu coba lagi." };
        }
        console.warn("Supabase auth signUp error, falling back to local registration:", error.message);
      } else if (data.user) {
        const newUser: StoredUser = {
          email: cleanEmail,
          role: "user",
          createdAt: new Date().toISOString(),
        };
        inMemoryUsers.push(newUser);
        return { success: true };
      }
    } catch (err: any) {
      console.warn("Supabase signup exception, falling back to local:", err);
    }
  }

  // 2. In-memory / local fallback
  const existing = getAllUsers().find((u) => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    return { success: false, error: "Email sudah terdaftar. Silakan login." };
  }

  const newUser: StoredUser = {
    email: cleanEmail,
    password,
    role: "user",
    createdAt: new Date().toISOString(),
  };

  inMemoryUsers.push(newUser);

  try {
    ensureDataDir();
    const current = getAllUsers();
    fs.writeFileSync(USERS_FILE, JSON.stringify([...current, newUser], null, 2), "utf-8");
  } catch {
    // Vercel serverless read-only safe
  }

  return { success: true };
}

export function deleteStoredUser(email: string): boolean {
  const cleanEmail = email.toLowerCase().trim();
  const adminEmail = (process.env.ADMIN_EMAIL || "adminflix123@gmail.com").toLowerCase();
  if (cleanEmail === adminEmail) return false;

  inMemoryUsers = inMemoryUsers.filter((u) => u.email.toLowerCase() !== cleanEmail);

  try {
    ensureDataDir();
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, "utf-8");
      const diskUsers = JSON.parse(raw) as StoredUser[];
      const filtered = diskUsers.filter((u) => u.email.toLowerCase() !== cleanEmail);
      fs.writeFileSync(USERS_FILE, JSON.stringify(filtered, null, 2), "utf-8");
    }
  } catch {
    // Safe for serverless
  }
  return true;
}
