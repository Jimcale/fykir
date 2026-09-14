"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

export function Sheet({
  open,
  onClose,
  children,
  align = "center",
  maxWidth = "max-w-md",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  align?: "center" | "top";
  maxWidth?: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={`fixed inset-0 z-50 flex justify-center ${
            align === "top" ? "items-end sm:items-start sm:pt-24" : "items-end sm:items-center"
          }`}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <motion.div
            className="absolute inset-0 bg-ink/45"
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.div
            className={`relative max-h-[92vh] w-full ${maxWidth} overflow-y-auto rounded-t-[26px] bg-surface shadow-2xl sm:rounded-[26px]`}
            variants={{
              hidden: { opacity: 0, y: 40 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.24, ease: "easeOut" }}
          >
            <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-border sm:hidden" />
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
