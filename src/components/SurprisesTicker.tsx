"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGift } from "@fortawesome/free-solid-svg-icons";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { onSnapshot, limit, orderBy, query } from "firebase/firestore";
import { giftsCol } from "@/lib/firebase/collections";
import { timeAgo } from "@/lib/catalog";
import type { Gift } from "@/lib/types";

const DISPLAY_MS = 3800;

export function SurprisesTicker() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const q = query(giftsCol, orderBy("created_at", "desc"), limit(16));
    return onSnapshot(q, (snap) => setGifts(snap.docs.map((d) => d.data())));
  }, []);

  useEffect(() => {
    if (gifts.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % gifts.length), DISPLAY_MS);
    return () => clearInterval(t);
  }, [gifts.length]);

  if (gifts.length === 0) return null;

  const g = gifts[index % gifts.length];

  return (
    <div className="overflow-hidden border-y border-border bg-surface-2 px-5 py-3">
      <div className="mx-auto flex max-w-2xl items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={g.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex flex-wrap items-center justify-center gap-1.5 text-center text-xs font-semibold text-muted"
          >
            <FontAwesomeIcon icon={faGift} className="h-3 w-3 text-brand" />
            <span className="text-ink">
              {g.sender_anonymous ? g.sender_label : g.sender_label.split(" ")[0]}
            </span>
            <span>sent a surprise to</span>
            <span className="text-ink">{g.receiver_display_name.split(" ")[0]}</span>
            <span>
              · {g.city} · {g.created_at ? timeAgo(g.created_at.toDate()) : "just now"}
            </span>
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
