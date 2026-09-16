import { collection, doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { GiftCategory, Page, SenderProfile } from "@/lib/types";

interface SendGiftParams {
  senderUid: string;
  category: GiftCategory;
  amount: number;
  currency: string;
  countryCode: string;
  city: string;
  recipient: Page;
  sender: SenderProfile;
  note: string;
}

export async function sendGift(params: SendGiftParams) {
  const { senderUid, category, amount, currency, countryCode, city, recipient, sender, note } =
    params;

  const ref = doc(collection(db, "gifts"));
  const senderLabel = sender.anonymous ? sender.alias ?? "Someone" : sender.name || "A friend";

  const batch = writeBatch(db);
  batch.set(ref, {
    category_id: category.id,
    category_title: category.title,
    category_icon: category.icon,
    category_color: category.color_key,
    product_id: null,
    amount,
    currency,
    country_code: countryCode,
    city,
    sender_uid: senderUid,
    sender_anonymous: sender.anonymous,
    sender_label: senderLabel,
    receiver_page_id: recipient.id,
    receiver_username: recipient.username,
    receiver_display_name: recipient.display_name,
    status: "informed",
    redeem_method: null,
    redemption: null,
    thank_you: null,
    created_at: serverTimestamp(),
    opened_at: null,
    redeemed_at: null,
  });

  batch.set(doc(db, "gift_private", ref.id), {
    sender_uid: senderUid,
    sender_name: sender.name,
    sender_whatsapp: sender.whatsapp,
    sender_email: sender.email,
    note,
  });

  await batch.commit();
  return ref.id;
}
