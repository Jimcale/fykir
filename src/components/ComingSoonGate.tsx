"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleNotch } from "@fortawesome/free-solid-svg-icons";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";

export function ComingSoonGate({ children }: { children: ReactNode }) {
  const { loading, roleLoading, isAdmin } = useAuth();
  const { loading: settingsLoading, comingSoonMode } = useSettings();

  if (loading || roleLoading || settingsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <FontAwesomeIcon icon={faCircleNotch} className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  if (comingSoonMode && !isAdmin) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[oklch(30%_0.09_305)] to-[oklch(24%_0.08_340)] px-6 text-center text-white">
        <div className="animate-float-blob absolute -top-10 left-[10%] h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="animate-float-blob absolute bottom-0 right-[8%] h-56 w-56 rounded-full bg-white/10 blur-3xl [animation-delay:1.5s]" />
        <span className="animate-box-wiggle mb-6 text-6xl">🎁</span>
        <h1 className="font-display text-3xl font-bold">Fykir is almost here</h1>
        <p className="mt-3 max-w-sm text-sm text-white/80">
          We&apos;re putting the finishing touches on something special. Check back soon!
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
