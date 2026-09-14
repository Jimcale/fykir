"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleNotch,
  faGift,
  faMobileScreenButton,
  faStore,
} from "@fortawesome/free-solid-svg-icons";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { use, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Header } from "@/components/Header";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { useGiftProducts } from "@/lib/data-hooks";
import { db } from "@/lib/firebase/client";
import { giftRef, pageRef } from "@/lib/firebase/collections";
import { COLOR_BG, COLOR_TEXT, formatMoney } from "@/lib/catalog";
import { giftIcon } from "@/lib/icons";
import { sounds } from "@/lib/sounds";
import type { Gift, GiftProduct } from "@/lib/types";

const COUNTDOWN_START = 10;

export default function RevealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const { countries } = useSettings();

  const [gift, setGift] = useState<Gift | null | undefined>(undefined);
  const [note, setNote] = useState<string | null>(null);
  const [ownerUid, setOwnerUid] = useState<string | null>(null);
  const [count, setCount] = useState(COUNTDOWN_START);
  const [redeemMode, setRedeemMode] = useState<"choose" | "partner" | "cash" | null>(null);
  const [busy, setBusy] = useState(false);

  const { products } = useGiftProducts(gift?.category_id ?? null);

  useEffect(() => {
    getDoc(giftRef(id)).then((snap) => setGift(snap.exists() ? snap.data() : null));
  }, [id]);

  useEffect(() => {
    if (!gift) return;
    getDoc(pageRef(gift.receiver_page_id))
      .then((snap) => setOwnerUid(snap.exists() ? snap.data().owner_uid : null))
      .catch(() => {});
    getDoc(doc(db, "gift_private", id))
      .then((snap) => setNote(snap.exists() ? (snap.data().note as string) || null : null))
      .catch(() => {});
  }, [gift, id]);

  const alreadyOpened = gift && gift.status !== "informed";
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!gift) return;
    if (alreadyOpened) {
      setRevealed(true);
      return;
    }
    if (count <= 0) {
      setRevealed(true);
      updateDoc(giftRef(gift.id), { status: "opened", opened_at: serverTimestamp() }).catch(() => {});
      sounds.reveal();
      return;
    }
    const t = setTimeout(() => {
      setCount((c) => c - 1);
      sounds.countdownTick();
    }, 1000);
    return () => clearTimeout(t);
  }, [gift, count, alreadyOpened]);

  const isOwner = !!user && !!ownerUid && user.uid === ownerUid;
  const country = useMemo(
    () => countries.find((c) => c.code === gift?.country_code) ?? countries[0],
    [countries, gift]
  );
  const fee = country ? Math.round(((gift?.amount ?? 0) * country.cash_payout_fee) / 100) : 0;
  const net = (gift?.amount ?? 0) - fee;

  const eligibleProducts = products.filter((p) => p.price <= (gift?.amount ?? 0));

  async function redeemWithProduct(product: GiftProduct) {
    if (!gift) return;
    setBusy(true);
    try {
      await updateDoc(giftRef(gift.id), {
        status: "redeemed",
        redeem_method: "partner",
        redeemed_at: serverTimestamp(),
        redemption: {
          method: "partner",
          partner_id: product.partner_id,
          partner_name: null,
          product_id: product.id,
          gross_amount: gift.amount,
          processing_fee: 0,
          net_amount: gift.amount,
          redeemed_at: serverTimestamp(),
        },
      });
      setGift({ ...gift, status: "redeemed", redeem_method: "partner" });
      sounds.success();
      toast.success("Voucher redeemed!");
    } catch {
      toast.error("Couldn't redeem right now.");
      sounds.error();
    } finally {
      setBusy(false);
    }
  }

  async function redeemCash() {
    if (!gift) return;
    setBusy(true);
    try {
      await updateDoc(giftRef(gift.id), {
        status: "redeemed",
        redeem_method: "mpesa_cash",
        redeemed_at: serverTimestamp(),
        redemption: {
          method: "mpesa_cash",
          partner_id: null,
          partner_name: null,
          product_id: null,
          gross_amount: gift.amount,
          processing_fee: fee,
          net_amount: net,
          redeemed_at: serverTimestamp(),
        },
      });
      setGift({ ...gift, status: "redeemed", redeem_method: "mpesa_cash" });
      sounds.success();
      toast.success(`${formatMoney(net, gift.currency)} sent to your M-Pesa!`);
    } catch {
      toast.error("Couldn't redeem right now.");
      sounds.error();
    } finally {
      setBusy(false);
    }
  }

  if (gift === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <FontAwesomeIcon icon={faCircleNotch} className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  if (gift === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 text-center">
        <p className="font-display text-xl font-bold">Surprise not found</p>
        <p className="text-sm text-muted">This link may be invalid.</p>
      </div>
    );
  }

  if (!revealed) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[oklch(30%_0.09_305)] to-[oklch(24%_0.08_340)] px-6 text-center text-white">
        <div className="animate-twinkle absolute left-[15%] top-[20%] h-2 w-2 rounded-full bg-white" />
        <div className="animate-twinkle absolute right-[18%] top-[30%] h-1.5 w-1.5 rounded-full bg-white [animation-delay:0.6s]" />
        <div className="animate-twinkle absolute bottom-[25%] left-[25%] h-1.5 w-1.5 rounded-full bg-white [animation-delay:1.2s]" />
        <div className="animate-float-blob absolute -top-10 left-[10%] h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="animate-float-blob absolute bottom-0 right-[8%] h-56 w-56 rounded-full bg-white/10 blur-3xl [animation-delay:1.5s]" />

        <span className="mb-4 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold backdrop-blur">
          {gift.receiver_display_name.split(" ")[0]}, someone sent you a surprise
        </span>
        <div className="animate-box-wiggle mb-6 text-7xl">🎁</div>
        <p className="animate-count-pulse font-display text-6xl font-bold">{count}</p>
        <p className="mt-3 text-sm text-white/80">Your surprise unlocks in...</p>
        <p className="mt-8 text-sm text-white/70">
          From <span className="font-bold text-white">{gift.sender_label}</span>
        </p>
        <p className="mt-1 text-xs text-white/50">Don&apos;t peek — good things are worth the wait</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-5 py-12 text-center">
        <span className="animate-pop-in mb-4 rounded-full bg-brand-soft px-4 py-1.5 text-xs font-bold text-brand">
          ✨ Surprise unlocked!
        </span>
        <span className={`animate-pop-in mb-4 flex h-20 w-20 items-center justify-center rounded-full ${COLOR_BG[gift.category_color]}`}>
          <FontAwesomeIcon icon={giftIcon(gift.category_icon)} className={`h-8 w-8 ${COLOR_TEXT[gift.category_color]}`} />
        </span>
        <h1 className="font-display text-2xl font-bold">{gift.category_title} voucher</h1>
        <p className="mt-1 font-display text-3xl font-bold text-brand">
          {formatMoney(gift.amount, gift.currency)}
        </p>
        <p className="mt-2 text-sm text-muted">Sent with love, just for you 🎉</p>

        <div className="mt-6 w-full rounded-2xl bg-surface-2 p-4 text-left">
          <p className="text-xs font-bold text-muted">From</p>
          <p className="text-sm font-semibold">{gift.sender_label}</p>
          {note && <p className="mt-2 text-sm italic text-ink/80">&ldquo;{note}&rdquo;</p>}
        </div>

        {gift.status === "redeemed" ? (
          <div className="mt-6 w-full rounded-2xl border border-green/30 bg-green-soft p-4">
            <p className="flex items-center justify-center gap-2 text-sm font-bold text-green">
              <FontAwesomeIcon icon={faCircleCheck} className="h-4 w-4" />
              Voucher redeemed
            </p>
            <p className="mt-1 text-xs text-muted">
              {gift.redeem_method === "mpesa_cash"
                ? `${formatMoney(gift.redemption?.net_amount ?? net, gift.currency)} sent to M-Pesa`
                : "Redeemed with a partner"}
            </p>
          </div>
        ) : !isOwner ? (
          <p className="mt-8 text-xs text-muted">
            This surprise is for {gift.receiver_display_name} — open this link signed in as them
            to redeem it.
          </p>
        ) : redeemMode === null ? (
          <div className="mt-6 flex w-full flex-col gap-2.5">
            <button
              onClick={() => setRedeemMode("choose")}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-[15px] font-display font-semibold text-white active:scale-[0.98]"
            >
              <FontAwesomeIcon icon={faStore} className="h-4 w-4" />
              Redeem at a partner
            </button>
            <button
              onClick={() => setRedeemMode("cash")}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-[15px] font-display font-semibold active:scale-[0.98]"
            >
              <FontAwesomeIcon icon={faMobileScreenButton} className="h-4 w-4" />
              Convert to M-Pesa cash
            </button>
          </div>
        ) : redeemMode === "choose" ? (
          <div className="mt-6 w-full text-left">
            <p className="mb-2 text-xs font-bold text-muted">
              Use the full {formatMoney(gift.amount, gift.currency)} in-store
            </p>
            <div className="flex flex-col gap-2">
              {eligibleProducts.length === 0 && (
                <p className="rounded-2xl border border-dashed border-border p-4 text-center text-sm text-muted">
                  No partner products available for this amount yet.
                </p>
              )}
              {eligibleProducts.map((p) => (
                <button
                  key={p.id}
                  disabled={busy}
                  onClick={() => redeemWithProduct(p)}
                  className="rounded-2xl border border-border p-3.5 text-left hover:bg-surface-2 disabled:opacity-60"
                >
                  <p className="text-sm font-bold">{p.title}</p>
                  <p className="text-xs font-semibold text-brand">{formatMoney(p.price, gift.currency)}</p>
                  <p className="mt-1 text-xs text-muted">{p.redeem_instructions}</p>
                </button>
              ))}
            </div>
            <button onClick={() => setRedeemMode(null)} className="mt-3 text-xs font-bold text-muted">
              Back
            </button>
          </div>
        ) : (
          <div className="mt-6 w-full text-left">
            <div className="mb-4 flex flex-col gap-2 rounded-2xl bg-surface-2 p-4 text-sm">
              <Row label="Voucher amount" value={formatMoney(gift.amount, gift.currency)} />
              <Row
                label={`Processing fee (${country?.cash_payout_fee ?? 0}%)`}
                value={`-${formatMoney(fee, gift.currency)}`}
                red
              />
              <div className="h-px bg-border" />
              <Row label="You receive" value={formatMoney(net, gift.currency)} bold green />
            </div>
            <button
              onClick={redeemCash}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-[15px] font-display font-semibold text-white disabled:opacity-60"
            >
              {busy && <FontAwesomeIcon icon={faCircleNotch} className="h-4 w-4 animate-spin" />}
              Confirm M-Pesa payout
            </button>
            <button onClick={() => setRedeemMode(null)} className="mt-3 text-xs font-bold text-muted">
              Back
            </button>
          </div>
        )}

        <a href="/create" className="mt-10 flex items-center gap-1.5 text-xs font-bold text-muted">
          <FontAwesomeIcon icon={faGift} className="h-3 w-3" />
          Create your own Fykir page →
        </a>
      </main>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  red,
  green,
}: {
  label: string;
  value: string;
  bold?: boolean;
  red?: boolean;
  green?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={bold ? "font-bold" : "text-muted"}>{label}</span>
      <span className={`${bold ? "font-bold" : ""} ${red ? "text-brand" : ""} ${green ? "text-green" : ""}`}>
        {value}
      </span>
    </div>
  );
}
