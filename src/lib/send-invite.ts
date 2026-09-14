import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { GiftCategory } from "@/lib/types";

interface SendInviteParams {
  senderUid: string;
  senderName: string;
  senderWhatsapp: string;
  receiverName: string;
  receiverWhatsapp: string;
  category: GiftCategory;
  amount: number;
  currency: string;
  countryCode: string;
}

export async function sendInvite(params: SendInviteParams) {
  const {
    senderUid,
    senderName,
    senderWhatsapp,
    receiverName,
    receiverWhatsapp,
    category,
    amount,
    currency,
    countryCode,
  } = params;

  await addDoc(collection(db, "invites"), {
    sender_uid: senderUid,
    sender_name: senderName,
    sender_whatsapp: senderWhatsapp,
    receiver_name: receiverName,
    receiver_whatsapp: receiverWhatsapp,
    category_id: category.id,
    category_title: category.title,
    amount,
    currency,
    country_code: countryCode,
    status: "sent",
    created_at: serverTimestamp(),
  });
}
