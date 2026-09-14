import {
  documentId,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { pagesCol } from "@/lib/firebase/collections";
import type { Page } from "@/lib/types";

let recentPagesCache: Page[] | null = null;
let recentPagesCacheAt = 0;

async function getRecentPagesBatch(): Promise<Page[]> {
  if (recentPagesCache && Date.now() - recentPagesCacheAt < 60_000) {
    return recentPagesCache;
  }
  const snap = await getDocs(
    query(pagesCol, orderBy("created_at", "desc"), limit(30))
  );
  recentPagesCache = snap.docs.map((d) => d.data());
  recentPagesCacheAt = Date.now();
  return recentPagesCache;
}

export async function recentOrRandomPages(limitCount = 5): Promise<Page[]> {
  const batch = await getRecentPagesBatch();
  return batch.slice(0, limitCount);
}

export async function searchPages(rawQuery: string): Promise<Page[]> {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return recentOrRandomPages();

  const [prefixSnap, batch] = await Promise.all([
    getDocs(
      query(
        pagesCol,
        orderBy(documentId()),
        where(documentId(), ">=", q),
        where(documentId(), "<=", q + ""),
        limit(8)
      )
    ),
    getRecentPagesBatch(),
  ]);

  const results = new Map<string, Page>();
  prefixSnap.docs.forEach((d) => results.set(d.id, d.data()));
  batch
    .filter((p) => p.display_name.toLowerCase().includes(q))
    .forEach((p) => results.set(p.id, p));

  return Array.from(results.values()).slice(0, 8);
}
