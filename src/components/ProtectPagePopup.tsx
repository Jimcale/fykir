"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faCircleNotch, faShieldHalved, faXmark } from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { useState } from "react";
import toast from "react-hot-toast";
import { Sheet } from "@/components/ui/Sheet";
import { useAuth } from "@/lib/auth-context";
import { protectPageWithGoogle } from "@/lib/firebase/auth";
import { sounds } from "@/lib/sounds";

export function ProtectPagePopup({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  async function connect() {
    if (!user) return;
    setBusy(true);
    try {
      const { merged } = await protectPageWithGoogle(user);
      sounds.success();
      toast.success(
        merged
          ? "Signed in with your existing Google account"
          : "Your page is protected!"
      );
      onClose();
    } catch (err) {
      console.error(err);
      sounds.error();
      toast.error("Couldn't connect Google. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} maxWidth="max-w-sm">
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Protect your page</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 hover:bg-border/60"
          >
            <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mb-5 flex flex-col items-center text-center">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <FontAwesomeIcon icon={faShieldHalved} className="h-6 w-6" />
          </span>
          <p className="text-sm text-muted">
            Right now your page only lives in this browser. Link a Google account so you never
            lose access to it.
          </p>
        </div>

        <ul className="mb-5 flex flex-col gap-2 text-xs text-muted">
          <li className="flex items-center gap-2">
            <FontAwesomeIcon icon={faCheck} className="h-3 w-3 flex-shrink-0 text-green" />
            Keep your page if you clear your browser or switch devices
          </li>
          <li className="flex items-center gap-2">
            <FontAwesomeIcon icon={faCheck} className="h-3 w-3 flex-shrink-0 text-green" />
            Manage received gifts and your wishlist from anywhere
          </li>
          <li className="flex items-center gap-2">
            <FontAwesomeIcon icon={faCheck} className="h-3 w-3 flex-shrink-0 text-green" />
            Takes less than a minute
          </li>
        </ul>

        <button
          onClick={() => {
            sounds.tap();
            connect();
          }}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-[15px] font-display font-semibold text-white active:scale-[0.98] disabled:opacity-60"
        >
          <FontAwesomeIcon icon={busy ? faCircleNotch : faGoogle} className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
          Continue with Google
        </button>
      </div>
    </Sheet>
  );
}
