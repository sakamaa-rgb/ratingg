"use client";

import { useState, useEffect } from "react";
import { Trash2, Shield, Search, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AdminUser {
  id: string;
  email: string;
  role: "admin" | "moderator" | "user";
  status: "active" | "suspended";
  reviewsCount: number;
  lastActive: string;
}

const INITIAL_USERS: AdminUser[] = [
  { id: "usr_991", email: "adminflix123@gmail.com", role: "admin", status: "active", reviewsCount: 42, lastActive: "Baru saja" },
  { id: "usr_882", email: "critic_marcus@filmzine.net", role: "moderator", status: "active", reviewsCount: 156, lastActive: "10 mnt lalu" },
  { id: "usr_773", email: "elena.cinephile@proton.me", role: "user", status: "active", reviewsCount: 89, lastActive: "1 jam lalu" },
  { id: "usr_664", email: "spammer_bot_14@tempmail.io", role: "user", status: "suspended", reviewsCount: 2, lastActive: "2 hari lalu" },
  { id: "usr_555", email: "david_lynch_enthusiast@gmail.com", role: "user", status: "active", reviewsCount: 31, lastActive: "4 jam lalu" },
  { id: "usr_444", email: "sophia.movies@gmail.com", role: "user", status: "active", reviewsCount: 14, lastActive: "5 jam lalu" },
  { id: "usr_333", email: "film_geek_88@yahoo.com", role: "user", status: "active", reviewsCount: 65, lastActive: "1 hari lalu" },
  { id: "usr_222", email: "alexandra.director@cinema.org", role: "user", status: "active", reviewsCount: 78, lastActive: "2 hari lalu" },
  { id: "usr_111", email: "cinephile_jakarta@gmail.com", role: "user", status: "active", reviewsCount: 23, lastActive: "3 hari lalu" },
  { id: "usr_100", email: "moviebuff99@gmail.com", role: "user", status: "active", reviewsCount: 9, lastActive: "4 hari lalu" },
  { id: "usr_099", email: "screenwriter_dan@studio.id", role: "user", status: "active", reviewsCount: 112, lastActive: "5 hari lalu" },
];

const ITEMS_PER_PAGE = 5;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>(INITIAL_USERS);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Persistent deleted users tracking across reloads
  useEffect(() => {
    try {
      const savedDeleted = localStorage.getItem("brutal_deleted_operator_ids");
      const deletedSet: string[] = savedDeleted ? JSON.parse(savedDeleted) : [];

      fetch("/api/admin/users")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          let pool = [...INITIAL_USERS];
          if (data?.users && Array.isArray(data.users)) {
            data.users.forEach((u: AdminUser) => {
              if (!pool.some((p) => p.email.toLowerCase() === u.email.toLowerCase())) {
                pool.push(u);
              }
            });
          }
          // Filter out deleted users persistently!
          const active = pool.filter(
            (u) => !deletedSet.includes(u.id) && !deletedSet.includes(u.email.toLowerCase())
          );
          setUsers(active);
        })
        .catch(() => {
          const active = INITIAL_USERS.filter(
            (u) => !deletedSet.includes(u.id) && !deletedSet.includes(u.email.toLowerCase())
          );
          setUsers(active);
        });
    } catch {
      // safe fallback
    }
  }, []);

  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination / Carousel calculations
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
  const currentUsers = filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDelete = async (id: string, email: string) => {
    if (email.toLowerCase() === "adminflix123@gmail.com") {
      alert("Akun Admin utama dilindungi dan tidak dapat dihapus.");
      return;
    }

    setDeletingId(id);

    // Save to persistent storage so it stays deleted across reloads
    try {
      const savedDeleted = localStorage.getItem("brutal_deleted_operator_ids");
      const deletedSet: string[] = savedDeleted ? JSON.parse(savedDeleted) : [];
      if (!deletedSet.includes(id)) deletedSet.push(id);
      if (!deletedSet.includes(email.toLowerCase())) deletedSet.push(email.toLowerCase());
      localStorage.setItem("brutal_deleted_operator_ids", JSON.stringify(deletedSet));
    } catch {
      // safe
    }

    // Call API delete
    try {
      await fetch(`/api/admin/users?email=${encodeURIComponent(email)}`, {
        method: "DELETE",
      });
    } catch {
      // safe fallback
    }

    // Delay slightly for smooth Framer Motion exit animation
    setTimeout(() => {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setDeletingId(null);
      showToast(`OPERATOR [${email}] BERHASIL DIHAPUS DARI SISTEM`);

      // Adjust page if empty
      if (currentUsers.length === 1 && validCurrentPage > 1) {
        setCurrentPage((p) => p - 1);
      }
    }, 300);
  };

  return (
    <div className="space-y-6 font-mono">
      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-3 bg-black text-brutal-yellow border-2 border-black font-mono text-xs font-black uppercase flex items-center justify-between shadow-brutal"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-brutal-green" />
              <span>{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-white hover:text-red-400 font-black ml-4"
            >
              [X]
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER STRIP */}
      <div className="border-b-4 border-black pb-4 flex flex-col sm:flex-row justify-between sm:items-end gap-3">
        <div>
          <div className="inline-block bg-black text-white px-2 py-0.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1">
            ACCESS CONTROLS
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
            OPERATOR DIRECTORY
          </h1>
          <p className="text-xs text-neutral-600 mt-0.5">
            Total {users.length} akun terdaftar di sistem.
          </p>
        </div>

        {/* SEARCH BOX */}
        <div className="w-full sm:w-72">
          <div className="relative">
            <input
              type="text"
              placeholder="CARI OPERATOR..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs border-2 border-black bg-white focus:outline-none font-bold"
            />
            <Search className="w-4 h-4 absolute right-2.5 top-2.5 text-neutral-400" />
          </div>
        </div>
      </div>

      {/* TABLE WITH ANIMATION & CAROUSEL */}
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
              <AnimatePresence mode="popLayout">
                {currentUsers.map((user) => {
                  const isAdmin = user.role === "admin" || user.email.toLowerCase() === "adminflix123@gmail.com";
                  const isDeleting = deletingId === user.id;

                  return (
                    <motion.tr
                      key={user.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{
                        opacity: 0,
                        x: -80,
                        backgroundColor: "#fee2e2",
                        transition: { duration: 0.25 },
                      }}
                      className={`hover:bg-neutral-50 transition-colors ${
                        isDeleting ? "bg-red-100" : ""
                      }`}
                    >
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
                          className={`px-2 py-0.5 text-[10px] uppercase font-bold border border-black ${
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
                        {isAdmin ? (
                          <span className="text-[10px] font-bold text-neutral-400 uppercase px-2 py-1 bg-neutral-100 border border-neutral-300">
                            LOCKED (ADMIN)
                          </span>
                        ) : (
                          <button
                            onClick={() => handleDelete(user.id, user.email)}
                            disabled={isDeleting}
                            className="inline-flex items-center gap-1 px-3 py-1 border-2 border-black bg-white hover:bg-red-600 hover:text-white text-red-600 font-black uppercase text-[10px] shadow-brutal-sm active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>{isDeleting ? "DELETING..." : "DELETE"}</span>
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>

              {currentUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-500 font-bold uppercase">
                    Tidak ada operator ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* CAROUSEL / PAGINATION STRIP (TAMPIL JIKA BANYAK OPERATOR) */}
        {filteredUsers.length > ITEMS_PER_PAGE && (
          <div className="border-t-2 border-black bg-neutral-50 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs font-bold text-neutral-600 uppercase">
              CAROUSEL: MENAMPILKAN {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, filteredUsers.length)} DARI {filteredUsers.length} OPERATOR
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={validCurrentPage === 1}
                className="px-3 py-1.5 border-2 border-black bg-white hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs uppercase flex items-center gap-1 shadow-brutal-sm active:translate-y-0.5 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>PREV SLIDE</span>
              </button>

              {/* SLIDE INDICATORS */}
              <div className="flex items-center gap-1 px-2 font-mono text-xs font-black">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 border border-black font-black text-xs cursor-pointer ${
                      validCurrentPage === page
                        ? "bg-black text-white shadow-brutal-sm"
                        : "bg-white hover:bg-yellow-100 text-black"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={validCurrentPage === totalPages}
                className="px-3 py-1.5 border-2 border-black bg-white hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs uppercase flex items-center gap-1 shadow-brutal-sm active:translate-y-0.5 cursor-pointer"
              >
                <span>NEXT SLIDE</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
