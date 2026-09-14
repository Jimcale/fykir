import {
  collection,
  doc,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "./client";
import type {
  AppSettings,
  Gift,
  GiftCategory,
  GiftPrivate,
  GiftProduct,
  Page,
  Partner,
} from "@/lib/types";

function converter<T extends { id: string }>(): FirestoreDataConverter<T> {
  return {
    toFirestore: (data) => {
      const rest = { ...(data as T & { id: string }) };
      delete (rest as { id?: string }).id;
      return rest;
    },
    fromFirestore: (snap: QueryDocumentSnapshot) => {
      return { id: snap.id, ...snap.data() } as T;
    },
  };
}

export const appSettingsCol = collection(db, "app_settings").withConverter(
  converter<AppSettings & { id: string }>()
);
export const appSettingsRef = doc(db, "app_settings", "global").withConverter(
  converter<AppSettings & { id: string }>()
);

export const giftCategoriesCol = collection(db, "gift_categories").withConverter(
  converter<GiftCategory>()
);

export const partnersCol = collection(db, "partners").withConverter(
  converter<Partner>()
);

export const giftProductsCol = collection(db, "gift_products").withConverter(
  converter<GiftProduct>()
);

export const pagesCol = collection(db, "pages").withConverter(converter<Page>());

export function pageRef(username: string) {
  return doc(db, "pages", username).withConverter(converter<Page>());
}

export const giftsCol = collection(db, "gifts").withConverter(converter<Gift>());

export function giftRef(id: string) {
  return doc(db, "gifts", id).withConverter(converter<Gift>());
}

export const giftPrivateCol = collection(db, "gift_private").withConverter(
  converter<GiftPrivate & { id: string }>()
);

export function giftPrivateRef(id: string) {
  return doc(db, "gift_private", id).withConverter(
    converter<GiftPrivate & { id: string }>()
  );
}
