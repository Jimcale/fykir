"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { auth } from "@/lib/firebase/client";
import { signInAsGuest } from "@/lib/firebase/auth";
import { onSnapshot, query, where, limit } from "firebase/firestore";
import { pagesCol } from "@/lib/firebase/collections";
import type { Page } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  page: Page | null;
  pageLoading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  page: null,
  pageLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<Page | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

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

  return (
    <AuthContext.Provider value={{ user, loading, page, pageLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
