"use client";

import { faUsers } from "@fortawesome/free-solid-svg-icons";
import { deleteDoc, doc, getDocs, orderBy, query, updateDoc } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { db } from "@/lib/firebase/client";
import { pagesCol, usersCol } from "@/lib/firebase/collections";
import { useAuth } from "@/lib/auth-context";
import { sounds } from "@/lib/sounds";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { AdminSearchInput, EmptyState, RowActions, TabHeader } from "@/components/admin/Shared";
import type { AppUser, Page, UserRole } from "@/lib/types";

const ROLES: UserRole[] = ["user", "staff", "admin"];

function fmtDate(ts: AppUser["created_at"]) {
  if (!ts) return "—";
  return ts.toDate().toLocaleDateString();
}

export function UsersTab() {
  const { isAdmin, user: currentUser } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [pagesByUid, setPagesByUid] = useState<Map<string, Page>>(new Map());
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [deleting, setDeleting] = useState<AppUser | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    const [usersSnap, pagesSnap] = await Promise.all([
      getDocs(query(usersCol, orderBy("created_at", "desc"))),
      getDocs(pagesCol),
    ]);
    setUsers(usersSnap.docs.map((d) => d.data()));
    const map = new Map<string, Page>();
    pagesSnap.docs.forEach((d) => map.set(d.data().owner_uid, d.data()));
    setPagesByUid(map);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return users;
    return users.filter((u) =>
      `${u.email ?? ""} ${u.phone ?? ""} ${u.display_name ?? ""} ${u.id}`.toLowerCase().includes(term)
    );
  }, [users, q]);

  async function changeRole(u: AppUser, role: UserRole) {
    try {
      await updateDoc(doc(db, "users", u.id), { role });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role } : x)));
      sounds.success();
      toast.success(`${u.email ?? u.id} is now ${role}`);
    } catch {
      sounds.error();
      toast.error("Couldn't update role");
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteDoc(doc(db, "users", deleting.id));
      sounds.success();
      toast.success("User record removed");
      setDeleting(null);
      load();
    } catch {
      sounds.error();
      toast.error("Couldn't delete");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <TabHeader title="Users" description="Everyone who has signed in. Assign staff/admin access here." />
      <AdminSearchInput value={q} onChange={setQ} placeholder="Search by email, phone or uid…" />

      {loading ? (
        <p className="py-10 text-center text-sm text-muted">Loading…</p>
      ) : filtered.length === 0 ? (
        <EmptyState icon={faUsers} title="No users found" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2 text-xs font-bold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Page</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((u) => {
                const page = pagesByUid.get(u.id);
                return (
                  <tr key={u.id} className="bg-surface">
                    <td className="px-4 py-3">
                      <p className="font-semibold">{u.display_name || u.email || "Anonymous"}</p>
                      <p className="text-xs text-muted">{u.email ?? u.phone ?? u.id}</p>
                    </td>
                    <td className="px-4 py-3">
                      {page ? (
                        <Link href={`/p/${page.username}`} target="_blank" className="text-xs font-bold text-brand">
                          @{page.username}
                        </Link>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">{fmtDate(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        disabled={!isAdmin || u.id === currentUser?.uid}
                        onChange={(e) => changeRole(u, e.target.value as UserRole)}
                        className="rounded-lg border border-border bg-bg px-2 py-1.5 text-xs font-bold disabled:opacity-50"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {isAdmin && u.id !== currentUser?.uid && <RowActions onDelete={() => setDeleting(u)} />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Remove this user record?"
        description="This deletes their app profile (role/preferences) only — their sign-in and any page they own stay intact."
        busy={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
