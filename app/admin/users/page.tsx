"use client";

import { useState, useEffect } from "react";
import { Trash2, Shield, Search, ChevronLeft, ChevronRight, CheckCircle, UserCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AdminUser {
  id: string;
  email: string;
  role: "admin" | "moderator" | "user";
  status: "active" | "suspended";
  reviewsCount: number;
  lastActive: string;
}

const ITEMS_PER_PAGE = 5;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch real users authoritative from the server so Windows & Mobile are 100% IN SYNC
  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        if (data?.users && Array.isArray(data.users)) {
          setUsers(data.users);
          return;
        }
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
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

    // Call server API delete so it deletes across all devices (Windows & Mobile)
    try {
      await fetch(`/api/admin/users?email=${encodeURIComponent(email)}`, {
        method: "DELETE",
      });
    } catch {
      // safe fallback
    }

    // Smooth UI exit animation
    setTimeout(() => {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setDeletingId(null);
      showToast(`OPERATOR [${email}] BERHASIL DIHAPUS DARI SISTEM`);

      if (currentUsers.length === 1 && validCurrentPage > 1) {
        setCurrentPage((p) => p - 1);
      }
    }, 250);
  };

  return (
    <div className="space-y-6 font-mono max-w-full overflow-hidden">
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
              <CheckCircle className="w-4 h-4 text-brutal-green shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-white hover:text-red-400 font-black ml-4 cursor-pointer"
            >
              [X]
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER STRIP (RESPONSIVE) */}
      <div className="border-b-4 border-black pb-4 flex flex-col sm:flex-row justify-between sm:items-end gap-3">
        <div>
          <div className="inline-block bg-black text-white px-2 py-0.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1">
            ACCESS CONTROLS
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
            OPERATOR DIRECTORY
          </h1>
          <p className="text-xs text-neutral-600 mt-0.5">
            Total {users.length} akun aktif terhubung (Real-time Sync Windows & Mobile).
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

      {/* LOADING STATE */}
      {loading ? (
        <div className="p-8 border-4 border-black bg-white text-center font-bold text-xs uppercase shadow-brutal">
          MEMUAT DATA OPERATOR DARI SERVER...
        </div>
      ) : (
        <div className="border-4 border-black bg-white shadow-brutal">
          {/* MOBILE VIEW (< md): HIGHLY RESPONSIVE TOUCH-FRIENDLY CARDS */}
          <div className="block md:hidden divide-y-2 divide-black">
            <AnimatePresence mode="popLayout">
              {currentUsers.map((user) => {
                const isAdmin = user.role === "admin" || user.email.toLowerCase() === "adminflix123@gmail.com";
                const isDeleting = deletingId === user.id;

                return (
                  <motion.div
                    key={user.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{
                      opacity: 0,
                      x: -50,
                      backgroundColor: "#fee2e2",
                      transition: { duration: 0.25 },
                    }}
                    className={`p-4 space-y-3 ${isDeleting ? "bg-red-100" : "bg-white"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs bg-neutral-100 px-2 py-0.5 border border-black">
                        {user.id}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 border border-black font-bold uppercase text-[10px] ${
                            user.role === "admin"
                              ? "bg-brutal-yellow text-black"
                              : "bg-white text-black"
                          }`}
                        >
                          {user.role}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] uppercase font-bold border border-black bg-brutal-green text-black">
                          {user.status}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-neutral-500 font-bold uppercase">EMAIL IDENTIFIER</div>
                      <div className="font-black text-xs break-all">{user.email}</div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-neutral-600 border-t border-neutral-200 pt-2">
                      <span>Ulasan: <strong>{user.reviewsCount}</strong></span>
                      <span>Aktif: <strong>{user.lastActive}</strong></span>
                    </div>

                    <div className="pt-1">
                      {isAdmin ? (
                        <div className="w-full text-center py-1.5 bg-neutral-100 border border-neutral-300 text-[10px] font-bold text-neutral-500 uppercase">
                          LOCKED (ADMIN UTAMA)
                        </div>
                      ) : (
                        <button
                          onClick={() => handleDelete(user.id, user.email)}
                          disabled={isDeleting}
                          className="w-full flex items-center justify-center gap-2 py-2 border-2 border-black bg-white hover:bg-red-600 hover:text-white text-red-600 font-black uppercase text-xs shadow-brutal-sm active:translate-y-0.5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{isDeleting ? "MENGHAPUS..." : "DELETE OPERATOR"}</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {currentUsers.length === 0 && (
              <div className="p-8 text-center text-neutral-500 font-bold uppercase text-xs">
                Tidak ada operator ditemukan.
              </div>
            )}
          </div>

          {/* DESKTOP VIEW (>= md): FULL BRUTALIST TABLE */}
          <div className="hidden md:block overflow-x-auto">
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
                                : "bg-white text-black"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="p-3 border-r-2 border-black font-bold">
                          <span className="px-2 py-0.5 text-[10px] uppercase font-bold border border-black bg-brutal-green text-black">
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

          {/* CAROUSEL / PAGINATION STRIP (RESPONSIVE) */}
          {filteredUsers.length > ITEMS_PER_PAGE && (
            <div className="border-t-2 border-black bg-neutral-50 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-[11px] sm:text-xs font-bold text-neutral-600 uppercase text-center sm:text-left">
                MENAMPILKAN {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, filteredUsers.length)} DARI {filteredUsers.length} OPERATOR
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={validCurrentPage === 1}
                  className="px-3 py-1.5 border-2 border-black bg-white hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs uppercase flex items-center gap-1 shadow-brutal-sm active:translate-y-0.5 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>PREV</span>
                </button>

                {/* SLIDE INDICATORS */}
                <div className="flex items-center gap-1 px-1 font-mono text-xs font-black">
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
                  <span>NEXT</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
