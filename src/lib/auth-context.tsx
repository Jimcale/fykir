"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { auth, db } from "@/lib/firebase/client";
import { signInAsGuest } from "@/lib/firebase/auth";
import { doc, getDoc, onSnapshot, query, serverTimestamp, setDoc, where, limit } from "firebase/firestore";
import { pagesCol, userRef } from "@/lib/firebase/collections";
import type { Page, UserRole } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  page: Page | null;
  pageLoading: boolean;
  role: UserRole | null;
  roleLoading: boolean;
  isStaff: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  page: null,
  pageLoading: true,
  role: null,
  roleLoading: true,
  isStaff: false,
  isAdmin: false,
});

async function ensureUserDoc(u: User) {
  const ref = doc(db, "users", u.uid);
  const snap = await getDoc(userRef(u.uid));
  if (!snap.exists()) {
    await setDoc(ref, {
      email: u.email,
      phone: u.phoneNumber,
      display_name: u.displayName,
      role: "user",
      created_at: serverTimestamp(),
      last_seen_at: serverTimestamp(),
    });
  } else {
    await setDoc(
      ref,
      { last_seen_at: serverTimestamp(), email: u.email ?? snap.data().email ?? null },
      { merge: true }
    );
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<Page | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        signInAsGuest().catch(() => {
          setLoading(false);
        });
        return;
      }
      setUser(u);
      setLoading(false);
      ensureUserDoc(u).catch(() => {});
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) {
      setPage(null);
      setPageLoading(!loading);
      return;
    }
    setPageLoading(true);
    const q = query(pagesCol, where("owner_uid", "==", user.uid), limit(1));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setPage(snap.empty ? null : snap.docs[0].data());
        setPageLoading(false);
      },
      () => setPageLoading(false)
    );
    return unsub;
  }, [user, loading]);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setRoleLoading(!loading);
      return;
    }
    setRoleLoading(true);
    const unsub = onSnapshot(
      userRef(user.uid),
      (snap) => {
        setRole(snap.exists() ? snap.data().role : "user");
        setRoleLoading(false);
      },
      () => setRoleLoading(false)
    );
    return unsub;
  }, [user, loading]);

  const isStaff = role === "staff" || role === "admin";
  const isAdmin = role === "admin";

  return (
    <AuthContext.Provider
      value={{ user, loading, page, pageLoading, role, roleLoading, isStaff, isAdmin }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
