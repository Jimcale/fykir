"use client";

import { useEffect, useState } from "react";
import { onSnapshot, orderBy, query, where } from "firebase/firestore";
import { giftsCol } from "@/lib/firebase/collections";
import type { Gift } from "@/lib/types";

export function useReceivedGifts(pageId: string | null) {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pageId) {
      setGifts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(
      giftsCol,
      where("receiver_page_id", "==", pageId),
      orderBy("created_at", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setGifts(snap.docs.map((d) => d.data()));
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [pageId]);

  return { gifts, loading };
}

export function useSentGifts(uid: string | null) {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setGifts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(
      giftsCol,
      where("sender_uid", "==", uid),
      orderBy("created_at", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setGifts(snap.docs.map((d) => d.data()));
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [uid]);

  return { gifts, loading };
}
