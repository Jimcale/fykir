"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxOpen,
  faCheck,
  faCircleNotch,
  faClock,
  faMobileScreenButton,
  faStore,
} from "@fortawesome/free-solid-svg-icons";
import {
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { db } from "@/lib/firebase/client";
import { giftPrivateRef, giftProductsCol, giftRef, giftsCol, partnersCol } from "@/lib/firebase/collections";
import { useGiftCategories } from "@/lib/data-hooks";
import { useSettings } from "@/lib/settings-context";
import { useAuth } from "@/lib/auth-context";
import { COLOR_BG, COLOR_TEXT, formatMoney } from "@/lib/catalog";
import { giftIcon } from "@/lib/icons";
import { sendGift } from "@/lib/send-gift";
import { sounds } from "@/lib/sounds";
import { SearchResults } from "@/components/SearchResults";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Drawer } from "@/components/ui/Drawer";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { AddButton, AdminSearchInput, EmptyState, Field, TabHeader } from "@/components/admin/Shared";
import type { Gift, GiftCategory, GiftProduct, Page, Partner } from "@/lib/types";

const STATUS_STYLES: Record<Gift["status"], string> = {
  informed: "bg-yellow-soft text-[oklch(45%_0.12_85)]",
  opened: "bg-teal-soft text-[oklch(45%_0.1_200)]",
  redemption_requested: "bg-orange-soft text-[oklch(50%_0.13_55)]",
  redeemed: "bg-green-soft text-green",
};

const STATUS_LABELS: Record<Gift["status"], string> = {
  informed: "informed",
  opened: "opened",
  redemption_requested: "pending confirmation",
  redeemed: "redeemed",
};

export function GiftsTab() {
  const { user } = useAuth();
  const { categories } = useGiftCategories();
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Gift["status"]>("all");
  const [selected, setSelected] = useState<Gift | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleting, setDeleting] = useState<Gift | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    const snap = await getDocs(query(giftsCol, orderBy("created_at", "desc"), limit(300)));
    setGifts(snap.docs.map((d) => d.data()));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return gifts.filter((g) => {
      if (statusFilter !== "all" && g.status !== statusFilter) return false;
      if (!term) return true;
      return `${g.receiver_username} ${g.receiver_display_name} ${g.sender_label} ${g.category_title}`
        .toLowerCase()
        .includes(term);
    });
  }, [gifts, q, statusFilter]);

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteDoc(doc(db, "gift_private", deleting.id)).catch(() => {});
      await deleteDoc(doc(db, "gifts", deleting.id));
      sounds.success();
      toast.success("Gift deleted");
      setDeleting(null);
      setSelected(null);
      load();
    } catch {
      sounds.error();
      toast.error("Couldn't delete");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <TabHeader
        title="Gifts"
        description="Every surprise sent through Fykir."
        action={<AddButton label="Send a Gift" onClick={() => setAddOpen(true)} />}
      />

      <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <AdminSearchInput value={q} onChange={setQ} placeholder="Search by recipient, sender, category…" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="fk-input sm:w-44"
        >
          <option value="all">All statuses</option>
          <option value="informed">Informed</option>
          <option value="opened">Opened</option>
          <option value="redemption_requested">Pending confirmation</option>
          <option value="redeemed">Redeemed</option>
        </select>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-muted">Loading…</p>
      ) : filtered.length === 0 ? (
        <EmptyState icon={faBoxOpen} title="No gifts found" />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((g) => (
            <button
              key={g.id}
              onClick={() => setSelected(g)}
              className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface p-3.5 text-left hover:bg-surface-2"
            >
              <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${COLOR_BG[g.category_color]}`}>
                <FontAwesomeIcon icon={giftIcon(g.category_icon)} className={`h-4 w-4 ${COLOR_TEXT[g.category_color]}`} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">
                  {g.sender_label} → @{g.receiver_username}
                </p>
                <p className="truncate text-xs text-muted">
                  {g.category_title} · {formatMoney(g.amount, g.currency)}
                </p>
              </div>
              <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${STATUS_STYLES[g.status]}`}>
                {STATUS_LABELS[g.status]}
              </span>
            </button>
          ))}
        </div>
      )}

      <GiftDetailDrawer
        gift={selected}
        onClose={() => setSelected(null)}
        onChanged={(next) => {
          setGifts((prev) => prev.map((g) => (g.id === next.id ? next : g)));
          setSelected(next);
        }}
        onDelete={(g) => setDeleting(g)}
      />

      <AddGiftDrawer
        open={addOpen}
        onClose={() => setAddOpen(false)}
        senderUid={user?.uid ?? ""}
        categories={categories}
        onCreated={() => {
          setAddOpen(false);
          load();
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        title="Delete this gift?"
        description="This removes the gift and its private details permanently. This can't be undone."
        busy={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

function GiftDetailDrawer({
  gift,
  onClose,
  onChanged,
  onDelete,
}: {
  gift: Gift | null;
  onClose: () => void;
  onChanged: (g: Gift) => void;
  onDelete: (g: Gift) => void;
}) {
  const { countries } = useSettings();
  const [note, setNote] = useState<string | null>(null);
  const [senderName, setSenderName] = useState<string | null>(null);
  const [senderContact, setSenderContact] = useState<string | null>(null);
  const [products, setProducts] = useState<GiftProduct[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [mode, setMode] = useState<"idle" | "partner" | "cash">("idle");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!gift) return;
    setMode("idle");
    setNote(null);
    setSenderName(null);
    setSenderContact(null);
    getDoc(giftPrivateRef(gift.id))
      .then((snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setNote(d.note || null);
          setSenderName(d.sender_name || null);
          setSenderContact(d.sender_whatsapp || d.sender_email || null);
        }
      })
      .catch(() => {});
    getDocs(query(giftProductsCol, where("gift_category_id", "==", gift.category_id))).then((snap) =>
      setProducts(snap.docs.map((d) => d.data()))
    );
    getDocs(partnersCol).then((snap) => setPartners(snap.docs.map((d) => d.data())));
  }, [gift]);

  const country = countries.find((c) => c.code === gift?.country_code) ?? countries[0];
  const fee = gift && country ? Math.round((gift.amount * country.cash_payout_fee) / 100) : 0;
  const net = (gift?.amount ?? 0) - fee;
  const eligibleProducts = products.filter((p) => p.price <= (gift?.amount ?? 0) && p.stock > 0);

  async function markOpened() {
    if (!gift) return;
    setBusy(true);
    try {
      await updateDoc(giftRef(gift.id), { status: "opened", opened_at: serverTimestamp() });
      onChanged({ ...gift, status: "opened" });
      sounds.success();
      toast.success("Marked as opened");
    } catch {
      sounds.error();
      toast.error("Couldn't update");
    } finally {
      setBusy(false);
    }
  }

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
          partner_name: partners.find((p) => p.id === product.partner_id)?.name ?? null,
          product_id: product.id,
          gross_amount: gift.amount,
          processing_fee: 0,
          net_amount: gift.amount,
          redeemed_at: serverTimestamp(),
        },
      });
      onChanged({ ...gift, status: "redeemed", redeem_method: "partner" });
      sounds.success();
      toast.success("Marked as redeemed with partner");
    } catch {
      sounds.error();
      toast.error("Couldn't redeem");
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
      onChanged({ ...gift, status: "redeemed", redeem_method: "mpesa_cash" });
      sounds.success();
      toast.success("Marked as redeemed via M-Pesa");
    } catch {
      sounds.error();
      toast.error("Couldn't redeem");
    } finally {
      setBusy(false);
    }
  }

  async function confirmRedemption() {
    if (!gift || !gift.redemption) return;
    setBusy(true);
    try {
      const redemption = { ...gift.redemption, redeemed_at: serverTimestamp() };
      await updateDoc(giftRef(gift.id), { status: "redeemed", redeemed_at: serverTimestamp(), redemption });
      onChanged({ ...gift, status: "redeemed" });
      sounds.success();
      toast.success("Redemption confirmed");
    } catch {
      sounds.error();
      toast.error("Couldn't confirm");
    } finally {
      setBusy(false);
    }
  }

  async function rejectRedemption() {
    if (!gift) return;
    setBusy(true);
    try {
      await updateDoc(giftRef(gift.id), { status: "opened", redeem_method: null, redemption: null });
      onChanged({ ...gift, status: "opened", redeem_method: null, redemption: null });
      sounds.tap();
      toast.success("Request cancelled — voucher reopened");
    } catch {
      sounds.error();
      toast.error("Couldn't update");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Drawer
      open={!!gift}
      onClose={onClose}
      title="Gift details"
      subtitle={gift ? `${gift.category_title} · ${formatMoney(gift.amount, gift.currency)}` : undefined}
    >
      {gift && (
        <div className="flex flex-col gap-4">
          <div className={`flex items-center gap-3 rounded-2xl p-3.5 ${COLOR_BG[gift.category_color]}`}>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/60">
              <FontAwesomeIcon icon={giftIcon(gift.category_icon)} className={`h-4 w-4 ${COLOR_TEXT[gift.category_color]}`} />
            </span>
            <div>
              <p className="text-sm font-bold">{gift.category_title}</p>
              <p className="text-xs">{formatMoney(gift.amount, gift.currency)}</p>
            </div>
            <span className="ml-auto flex-shrink-0 rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-bold capitalize">
              {STATUS_LABELS[gift.status]}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs font-bold text-muted">To</p>
              <p className="font-semibold">@{gift.receiver_username}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-muted">From</p>
              <p className="font-semibold">
                {gift.sender_label}
                {gift.sender_anonymous ? " (anonymous)" : ""}
              </p>
            </div>
          </div>

          {(senderName || senderContact || note) && (
            <div className="rounded-xl bg-surface-2 p-3.5 text-sm">
              <p className="mb-1 text-xs font-bold text-muted">Sender contact (staff only)</p>
              {senderName && <p>{senderName}</p>}
              {senderContact && <p className="text-muted">{senderContact}</p>}
              {note && <p className="mt-2 italic">&ldquo;{note}&rdquo;</p>}
            </div>
          )}

          {gift.status === "redeemed" ? (
            <div className="rounded-xl border border-green/30 bg-green-soft p-3.5 text-sm">
              <p className="flex items-center gap-2 font-bold text-green">
                <FontAwesomeIcon icon={faCheck} className="h-3.5 w-3.5" /> Redeemed
              </p>
              <p className="mt-1 text-xs text-muted">
                {gift.redeem_method === "mpesa_cash"
                  ? `${formatMoney(gift.redemption?.net_amount ?? net, gift.currency)} via M-Pesa`
                  : `Via ${gift.redemption?.partner_name ?? "a partner"}`}
              </p>
            </div>
          ) : gift.status === "redemption_requested" ? (
            <div className="flex flex-col gap-3">
              <div className="rounded-xl border border-orange/30 bg-orange-soft p-3.5 text-sm">
                <p className="flex items-center gap-2 font-bold text-[oklch(50%_0.13_55)]">
                  <FontAwesomeIcon icon={faClock} className="h-3.5 w-3.5" /> Pending confirmation
                </p>
                <p className="mt-1 text-xs text-muted">
                  Recipient requested redemption via {gift.redemption?.partner_name ?? "a partner"}.
                  Confirm once the handoff is verified.
                </p>
              </div>
              <button
                onClick={confirmRedemption}
                disabled={busy}
                className="rounded-xl bg-brand py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                Confirm redeemed
              </button>
              <button
                onClick={rejectRedemption}
                disabled={busy}
                className="rounded-xl border border-border py-2.5 text-sm font-bold disabled:opacity-60"
              >
                Cancel request
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {gift.status === "informed" && (
                <button
                  onClick={markOpened}
                  disabled={busy}
                  className="rounded-xl border border-border py-2.5 text-sm font-bold disabled:opacity-60"
                >
                  Mark as opened
                </button>
              )}

              <p className="text-xs font-bold text-muted">Redeem on the recipient&apos;s behalf</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setMode(mode === "partner" ? "idle" : "partner")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-bold ${
                    mode === "partner" ? "border-brand bg-brand-soft text-brand" : "border-border"
                  }`}
                >
                  <FontAwesomeIcon icon={faStore} className="h-3.5 w-3.5" /> Partner
                </button>
                <button
                  onClick={() => setMode(mode === "cash" ? "idle" : "cash")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-bold ${
                    mode === "cash" ? "border-brand bg-brand-soft text-brand" : "border-border"
                  }`}
                >
                  <FontAwesomeIcon icon={faMobileScreenButton} className="h-3.5 w-3.5" /> M-Pesa
                </button>
              </div>

              {mode === "partner" && (
                <div className="flex flex-col gap-2">
                  {eligibleProducts.length === 0 && (
                    <p className="rounded-xl border border-dashed border-border p-3 text-center text-xs text-muted">
                      No in-stock partner offers this amount can cover.
                    </p>
                  )}
                  {eligibleProducts.map((p) => {
                    const partner = partners.find((pt) => pt.id === p.partner_id);
                    return (
                      <button
                        key={p.id}
                        disabled={busy}
                        onClick={() => redeemWithProduct(p)}
                        className="rounded-xl border border-border p-3 text-left text-sm hover:bg-surface-2 disabled:opacity-60"
                      >
                        <p className="font-bold">{partner?.name ?? "Partner"}</p>
                        <p className="text-xs text-muted">
                          From {formatMoney(p.price, gift.currency)} · {p.stock} in stock
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}

              {mode === "cash" && (
                <div className="rounded-xl bg-surface-2 p-3.5 text-sm">
                  <div className="mb-3 flex flex-col gap-1.5">
                    <Row label="Voucher amount" value={formatMoney(gift.amount, gift.currency)} />
                    <Row label={`Processing fee (${country?.cash_payout_fee ?? 0}%)`} value={`-${formatMoney(fee, gift.currency)}`} />
                    <div className="h-px bg-border" />
                    <Row label="Recipient receives" value={formatMoney(net, gift.currency)} bold />
                  </div>
                  <button
                    onClick={redeemCash}
                    disabled={busy}
                    className="w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white disabled:opacity-60"
                  >
                    Confirm M-Pesa payout
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="mt-2 h-px bg-border" />
          <button onClick={() => onDelete(gift)} className="self-start text-xs font-bold text-brand">
            Delete this gift
          </button>
        </div>
      )}
    </Drawer>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={bold ? "font-bold" : "text-muted"}>{label}</span>
      <span className={bold ? "font-bold" : ""}>{value}</span>
    </div>
  );
}

function AddGiftDrawer({
  open,
  onClose,
  senderUid,
  categories,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  senderUid: string;
  categories: GiftCategory[];
  onCreated: () => void;
}) {
  const { countries } = useSettings();
  const [step, setStep] = useState<"category" | "recipient" | "details">("category");
  const [category, setCategory] = useState<GiftCategory | null>(null);
  const [amount, setAmount] = useState(0);
  const [recipient, setRecipient] = useState<Page | null>(null);
  const [senderLabel, setSenderLabel] = useState("Fykir Team");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep("category");
    setCategory(null);
    setAmount(0);
    setRecipient(null);
    setSenderLabel("Fykir Team");
    setNote("");
  }, [open]);

  async function submit() {
    if (!category || !recipient || !senderUid) return;
    setSubmitting(true);
    try {
      const country = countries.find((c) => c.code === recipient.country_code) ?? countries[0];
      await sendGift({
        senderUid,
        category,
        amount,
        currency: country?.currency ?? "KES",
        countryCode: recipient.country_code,
        city: recipient.city ?? country?.city ?? "",
        recipient,
        sender: { name: senderLabel, whatsapp: "", email: "", anonymous: false, alias: null },
        note,
      });
      sounds.success();
      toast.success("Gift sent");
      onCreated();
    } catch {
      sounds.error();
      toast.error("Couldn't send gift");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Drawer open={open} onClose={onClose} title="Send a gift" subtitle="Issue a gift manually — e.g. a comp or goodwill voucher.">
      {step === "category" && (
        <div>
          <p className="mb-3 text-xs font-bold text-muted">Pick a category</p>
          <div className="grid grid-cols-3 gap-2.5">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setCategory(c);
                  setAmount(c.min_amount);
                  setStep("recipient");
                }}
                className="flex flex-col items-center gap-1.5 rounded-2xl border border-border p-3 hover:bg-surface-2"
              >
                <span className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl ${COLOR_BG[c.color_key]}`}>
                  <CategoryIcon icon={c.icon} imageUrl={c.image_url} className={`h-4 w-4 ${COLOR_TEXT[c.color_key]}`} />
                </span>
                <span className="text-center text-[11px] font-semibold leading-tight">{c.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "recipient" && (
        <SearchResults
          onSelect={(p) => {
            setRecipient(p);
            setStep("details");
          }}
          autoFocus={false}
        />
      )}

      {step === "details" && category && recipient && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl bg-surface-2 p-3 text-sm">
            Sending <b>{category.title}</b> to <b>@{recipient.username}</b>
          </div>
          <Field label={`Amount (min ${formatMoney(category.min_amount)})`}>
            <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="fk-input" />
          </Field>
          <Field label="Shown as sender">
            <input value={senderLabel} onChange={(e) => setSenderLabel(e.target.value)} className="fk-input" />
          </Field>
          <Field label="Note (optional)">
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="fk-input resize-none" />
          </Field>
          <button
            onClick={submit}
            disabled={submitting || amount <= 0}
            className="flex items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {submitting && <FontAwesomeIcon icon={faCircleNotch} className="h-3.5 w-3.5 animate-spin" />}
            Send gift
          </button>
        </div>
      )}
    </Drawer>
  );
}
