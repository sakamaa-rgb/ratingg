import fs from "fs";
import path from "path";

export interface StoredUser {
  email: string;
  password: string;
  role: "admin" | "user";
  createdAt: string;
}

const USERS_FILE = path.join(process.cwd(), "data", "users.json");

function ensureDataDir() {
  const dir = path.dirname(USERS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function getAllUsers(): StoredUser[] {
  ensureDataDir();
  if (!fs.existsSync(USERS_FILE)) {
    // Seed with the default admin account
    const adminEmail = process.env.ADMIN_EMAIL || "adminflix123@gmail.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "adminflix123";
    const seed: StoredUser[] = [
      {
        email: adminEmail,
        password: adminPassword,
        role: "admin",
        createdAt: new Date().toISOString(),
      },
    ];
    fs.writeFileSync(USERS_FILE, JSON.stringify(seed, null, 2), "utf-8");
    return seed;
  }

  try {
    const raw = fs.readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(raw) as StoredUser[];
  } catch {
    return [];
  }
}

export function findUser(email: string): StoredUser | undefined {
  const users = getAllUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function validateLogin(email: string, password: string): StoredUser | null {
  // Always check env admin credentials first (hardcoded admin override)
  const adminEmail = process.env.ADMIN_EMAIL || "adminflix123@gmail.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "adminflix123";

  if (email.toLowerCase() === adminEmail.toLowerCase() && password === adminPassword) {
    return {
      email: adminEmail,
      password: adminPassword,
      role: "admin",
      createdAt: new Date().toISOString(),
    };
  }

  // Check registered users
  const user = findUser(email);
  if (user && user.password === password) {
    return user;
  }

  return null;
}

export function registerUser(email: string, password: string): { success: boolean; error?: string } {
  const users = getAllUsers();

  // Check if email already exists
  const exists = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return { success: false, error: "Email sudah terdaftar." };
  }

  // Determine role — admin if email matches admin env, else user
  const adminEmail = process.env.ADMIN_EMAIL || "adminflix123@gmail.com";
  const role = email.toLowerCase() === adminEmail.toLowerCase() ? "admin" : "user";

  const newUser: StoredUser = {
    email,
    password,
    role,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");

  return { success: true };
}
