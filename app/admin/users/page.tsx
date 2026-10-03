"use client";

import { useState } from "react";
import { UserCheck, UserX, Shield, Search } from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  role: "admin" | "moderator" | "user";
  status: "active" | "suspended";
  reviewsCount: number;
  lastActive: string;
}

const INITIAL_USERS: AdminUser[] = [
  { id: "usr_991", email: "adminflix123@gmail.com", role: "admin", status: "active", reviewsCount: 42, lastActive: "Just now" },
  { id: "usr_882", email: "critic_marcus@filmzine.net", role: "moderator", status: "active", reviewsCount: 156, lastActive: "10 mins ago" },
  { id: "usr_773", email: "elena.cinephile@proton.me", role: "user", status: "active", reviewsCount: 89, lastActive: "1 hour ago" },
  { id: "usr_664", email: "spammer_bot_14@tempmail.io", role: "user", status: "suspended", reviewsCount: 2, lastActive: "2 days ago" },
  { id: "usr_555", email: "david_lynch_enthusiast@gmail.com", role: "user", status: "active", reviewsCount: 31, lastActive: "4 hours ago" },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>(INITIAL_USERS);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          return {
            ...u,
            status: u.status === "active" ? "suspended" : "active",
          };
        }
        return u;
      })
    );
  };

  return (
    <div className="space-y-6 font-mono">
      <div className="border-b-4 border-black pb-4 flex flex-col sm:flex-row justify-between sm:items-end gap-3">
        <div>
          <div className="inline-block bg-black text-white px-2 py-0.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1">
            ACCESS CONTROLS
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
            OPERATOR DIRECTORY
          </h1>
        </div>
        <div className="w-full sm:w-64">
          <div className="relative">
            <input
              type="text"
              placeholder="SEARCH OPERATORS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-xs border-2 border-black bg-white focus:outline-none"
            />
            <Search className="w-4 h-4 absolute right-2.5 top-2.5 text-neutral-400" />
          </div>
        </div>
      </div>

      <div className="border-4 border-black bg-white shadow-brutal">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-black bg-neutral-100 uppercase font-bold text-neutral-700">
                <th className="p-3 border-r-2 border-black">OPERATOR ID</th>
                <th className="p-3 border-r-2 border-black">EMAIL IDENTIFIER</th>
                <th className="p-3 border-r-2 border-black">CLEARANCE ROLE</th>
                <th className="p-3 border-r-2 border-black">STATUS</th>
                <th className="p-3 border-r-2 border-black">SUBMISSIONS</th>
                <th className="p-3 border-r-2 border-black">LAST ACTIVITY</th>
                <th className="p-3 text-right">COMMAND</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-neutral-50">
                  <td className="p-3 font-bold border-r-2 border-black">{user.id}</td>
                  <td className="p-3 font-bold border-r-2 border-black">{user.email}</td>
                  <td className="p-3 border-r-2 border-black">
                    <span
                      className={`px-2 py-0.5 border border-black font-bold uppercase text-[10px] ${
                        user.role === "admin"
                          ? "bg-brutal-yellow text-black"
                          : user.role === "moderator"
                          ? "bg-brutal-cyan text-black"
                          : "bg-white text-black"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="p-3 border-r-2 border-black font-bold">
                    <span
                      className={`px-2 py-0.5 text-[10px] uppercase font-bold ${
                        user.status === "active"
                          ? "bg-brutal-green text-black"
                          : "bg-brutal-red text-white"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="p-3 border-r-2 border-black font-bold">{user.reviewsCount}</td>
                  <td className="p-3 border-r-2 border-black text-neutral-600">{user.lastActive}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => toggleStatus(user.id)}
                      className={`px-2.5 py-1 border-2 border-black text-[11px] font-bold uppercase transition-all shadow-brutal-sm active:translate-y-0.5 ${
                        user.status === "active"
                          ? "bg-white hover:bg-brutal-red hover:text-white"
                          : "bg-brutal-green text-black"
                      }`}
                    >
                      {user.status === "active" ? "SUSPEND" : "RESTORE"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
