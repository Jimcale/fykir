"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  busy,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center px-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-ink/45" onClick={onCancel} />
          <motion.div
            className="relative w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-2xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
          >
            <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-brand">
              <FontAwesomeIcon icon={faTriangleExclamation} className="h-4 w-4" />
            </span>
            <h3 className="font-display text-base font-semibold">{title}</h3>
            <p className="mt-1.5 text-sm text-muted">{description}</p>
            <div className="mt-5 flex gap-2.5">
              <button
                onClick={onCancel}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-bold"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={busy}
                className="flex-1 rounded-xl bg-brand py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
