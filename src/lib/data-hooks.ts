"use client";

import { useEffect, useState } from "react";
import { getDocs, orderBy, query, where } from "firebase/firestore";
import {
  giftCategoriesCol,
  giftProductsCol,
  partnersCol,
} from "@/lib/firebase/collections";
import type { GiftCategory, GiftProduct, Partner } from "@/lib/types";

let categoriesCache: GiftCategory[] | null = null;
let partnersCache: Partner[] | null = null;
const productsCache = new Map<string, GiftProduct[]>();

// Called after admin edits so the next mount of these hooks (e.g. navigating
// back to the public site) re-fetches instead of serving stale data.
export function invalidateGiftCategoriesCache() {
  categoriesCache = null;
}
export function invalidatePartnersCache() {
  partnersCache = null;
}
export function invalidateGiftProductsCache(categoryId?: string) {
  if (categoryId) productsCache.delete(categoryId);
  else productsCache.clear();
}

export function useGiftCategories() {
  const [categories, setCategories] = useState<GiftCategory[]>(
    categoriesCache ?? []
  );
  const [loading, setLoading] = useState(!categoriesCache);

  useEffect(() => {
    if (categoriesCache) return;
    getDocs(query(giftCategoriesCol, orderBy("order"))).then((snap) => {
      categoriesCache = snap.docs.map((d) => d.data());
      setCategories(categoriesCache);
      setLoading(false);
    });
  }, []);

  return { categories, loading };
}

export function usePartners() {
  const [partners, setPartners] = useState<Partner[]>(partnersCache ?? []);
  const [loading, setLoading] = useState(!partnersCache);

  useEffect(() => {
    if (partnersCache) return;
    getDocs(partnersCol).then((snap) => {
      partnersCache = snap.docs.map((d) => d.data());
      setPartners(partnersCache);
      setLoading(false);
    });
  }, []);

  return { partners, loading };
}

export function useGiftProducts(categoryId: string | null) {
  const [products, setProducts] = useState<GiftProduct[]>(
    categoryId ? productsCache.get(categoryId) ?? [] : []
  );
  const [loading, setLoading] = useState(
    !!categoryId && !productsCache.has(categoryId)
  );

  useEffect(() => {
    if (!categoryId) {
      setProducts([]);
      return;
    }
    const cached = productsCache.get(categoryId);
    if (cached) {
      setProducts(cached);
      return;
    }
    setLoading(true);
    getDocs(
      query(giftProductsCol, where("gift_category_id", "==", categoryId))
    ).then((snap) => {
      const list = snap.docs.map((d) => d.data());
      productsCache.set(categoryId, list);
      setProducts(list);
      setLoading(false);
    });
  }, [categoryId]);

  return { products, loading };
}
