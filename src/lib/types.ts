import type { Timestamp } from "firebase/firestore";

export type PaymentMethodStatus = "active" | "coming_soon";

export interface PaymentMethod {
  id: "mpesa" | "card";
  label: string;
  status: PaymentMethodStatus;
}

export interface Country {
  code: string;
  name: string;
  flag: string;
  city: string;
  currency: string;
  cash_payout_fee: number;
  status: PaymentMethodStatus;
  payment_methods: PaymentMethod[];
}

export interface AppSettings {
  countries: Country[];
}

export interface GiftCategory {
  id: string;
  title: string;
  icon: string;
  image_url: string | null;
  color_key: ColorKey;
  min_amount: number;
  max_amount: number;
  order: number;
}

export type ColorKey =
  | "brand"
  | "yellow"
  | "green"
  | "violet"
  | "teal"
  | "orange"
  | "pink";

export interface Partner {
  id: string;
  name: string;
  business_type: string;
  address: string;
  city: string;
  country: string;
  whatsapp: string;
}

export interface GiftProduct {
  id: string;
  gift_category_id: string;
  partner_id: string;
  price: number;
  stock: number;
  redeem_instructions: string;
}

export interface FeaturedGift {
  category_id: string;
  min_amount: number;
}

export interface Page {
  id: string; // == username
  username: string;
  display_name: string;
  whatsapp: string;
  email: string;
  birthday: string | null;
  bio: string;
  city: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  accent_color: string;
  cover_gradient: [string, string];
  featured: FeaturedGift[];
  owner_uid: string;
  country_code: string;
  created_at: Timestamp | null;
}

export type GiftStatus = "informed" | "opened" | "redeemed";
export type RedeemMethod = "partner" | "mpesa_cash";

export interface ThankYou {
  message: string;
  sent_at: Timestamp | null;
  seen: boolean;
}

export interface Redemption {
  method: RedeemMethod;
  partner_id: string | null;
  partner_name: string | null;
  product_id: string | null;
  gross_amount: number;
  processing_fee: number;
  net_amount: number;
  redeemed_at: Timestamp | null;
}

export interface Gift {
  id: string;
  category_id: string;
  category_title: string;
  category_icon: string;
  category_color: ColorKey;
  product_id: string | null;
  amount: number;
  currency: string;
  country_code: string;
  city: string;

  sender_uid: string;
  sender_anonymous: boolean;
  sender_label: string;

  receiver_page_id: string;
  receiver_username: string;
  receiver_display_name: string;

  status: GiftStatus;
  redeem_method: RedeemMethod | null;
  redemption: Redemption | null;
  thank_you: ThankYou | null;

  created_at: Timestamp | null;
  opened_at: Timestamp | null;
  redeemed_at: Timestamp | null;
}

export interface GiftPrivate {
  sender_uid: string;
  sender_name: string;
  sender_whatsapp: string;
  sender_email: string;
  note: string;
}

export interface SenderProfile {
  name: string;
  whatsapp: string;
  email: string;
  anonymous: boolean;
  alias: string | null;
}

export interface RecentSearchEntry {
  username: string;
  display_name: string;
  avatar_url: string | null;
  accent_color: string;
}

export type UserRole = "user" | "staff" | "admin";

export interface AppUser {
  id: string; // == uid
  email: string | null;
  phone: string | null;
  display_name: string | null;
  role: UserRole;
  created_at: Timestamp | null;
  last_seen_at: Timestamp | null;
}
