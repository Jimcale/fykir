"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase/client";
import { signInAsGuest, signInWithGoogle, signOutUser } from "@/lib/firebase/auth";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 font-sans dark:bg-black">
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">Fykir</h1>

      {loading ? (
        <p className="text-zinc-500">Loading...</p>
      ) : user ? (
        <div className="flex flex-col items-center gap-3">
          <p className="text-zinc-700 dark:text-zinc-300">
            Signed in as{" "}
            <span className="font-medium">{user.isAnonymous ? "Guest" : user.displayName ?? user.email}</span>
          </p>
          <button
            onClick={() => signOutUser()}
            className="rounded-full border border-black/[.08] px-5 py-2 text-sm font-medium hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
          >
            Sign out
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => signInWithGoogle()}
            className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Sign in with Google
          </button>
          <button
            onClick={() => signInAsGuest()}
            className="rounded-full border border-black/[.08] px-5 py-2 text-sm font-medium hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
          >
            Continue as guest
          </button>
        </div>
      )}
    </div>
  );
}
