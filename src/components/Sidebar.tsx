"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleNotch,
  faGift,
  faHandshake,
  faHeadset,
  faShareNodes,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import { SharePopup } from "@/components/SharePopup";
import { useAuth } from "@/lib/auth-context";
import { protectPageWithGoogle } from "@/lib/firebase/auth";
import { sounds } from "@/lib/sounds";

const LINKS = [
  { href: "/about", label: "About Fykir", icon: faGift },
  { href: "/partners", label: "For Partners", icon: faHandshake },
  { href: "/support", label: "Contact Support", icon: faHeadset },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const [shareOpen, setShareOpen] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  async function login() {
    if (!user || loggingIn) return;
    sounds.tap();
    setLoggingIn(true);
    try {
      await protectPageWithGoogle(user);
      sounds.success();
      toast.success("Logged in with Google");
      onClose();
    } catch (err) {
      console.error(err);
      sounds.error();
      toast.error("Couldn't log in. Please try again.");
    } finally {
      setLoggingIn(false);
    }
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50">
            <motion.div
              className="absolute inset-0 bg-ink/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={onClose}
            />
            <motion.div
              className="absolute inset-y-0 left-0 w-[270px] max-w-[80vw] bg-surface shadow-2xl"
              initial={{ x: -40, opacity: 0.5 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -40, opacity: 0.5 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-4">
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icon.png" alt="" width={32} height={32} className="h-8 w-8 rounded-[10px]" />
                  <span className="font-display text-lg font-semibold">Fykir</span>
                </div>
                <button
                  onClick={onClose}
                  className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-surface-2"
                >
                  <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
                </button>
              </div>

              <nav className="flex flex-col gap-1 p-3">
                {user?.isAnonymous && (
                  <button
                    onClick={login}
                    disabled={loggingIn}
                    className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold hover:bg-surface-2 disabled:opacity-60"
                  >
                    <FontAwesomeIcon
                      icon={loggingIn ? faCircleNotch : faGoogle}
                      className={`h-4 w-4 text-muted ${loggingIn ? "animate-spin" : ""}`}
                    />
                    Log in with Google
                  </button>
                )}
                {LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => {
                      sounds.tap();
                      onClose();
                    }}
                    className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold hover:bg-surface-2"
                  >
                    <FontAwesomeIcon icon={l.icon} className="h-4 w-4 text-muted" />
                    {l.label}
                  </Link>
                ))}
              </nav>

              <div className="mx-3 h-px bg-border" />

              <div className="p-3">
                <button
                  onClick={() => {
                    sounds.tap();
                    onClose();
                    setShareOpen(true);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-soft px-3 py-2.5 text-sm font-bold text-brand"
                >
                  <FontAwesomeIcon icon={faShareNodes} className="h-4 w-4" />
                  Share Fykir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <SharePopup
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        url={typeof window !== "undefined" ? window.location.origin : ""}
        text="Check out Fykir — send and receive surprise gifts with friends, family and followers! 🎁"
      />
    </>
  );
}
