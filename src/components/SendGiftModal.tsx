"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faCheck,
  faChevronRight,
  faCircleNotch,
  faMinus,
  faPaperPlane,
  faPlus,
  faUser,
  faUserPlus,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Sheet } from "@/components/ui/Sheet";
import { SearchResults } from "@/components/SearchResults";
import { useGiftCategories } from "@/lib/data-hooks";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import {
  AMOUNT_MAX_MULTIPLIER,
  ANON_ALIASES,
  COLOR_BG,
  COLOR_TEXT,
  amountChips,
  formatMoney,
  initials,
  roundToStep,
} from "@/lib/catalog";
import { giftIcon } from "@/lib/icons";
import { loadSenderProfile, saveSenderProfile } from "@/lib/local";
import { sendGift } from "@/lib/send-gift";
import { sendInvite } from "@/lib/send-invite";
import { sounds } from "@/lib/sounds";
import type { GiftCategory, Page, SenderProfile } from "@/lib/types";

type Step =
  | "category"
  | "amount"
  | "recipient-type"
  | "search"
  | "invite"
  | "invite-sending"
  | "invite-success"
  | "info"
  | "payment"
  | "processing"
  | "success";

const OUTCOME_STEPS: Step[] = ["processing", "success", "invite-sending", "invite-success"];

export function SendGiftModal({
  open,
  onClose,
  initialCategory,
  initialRecipient,
}: {
  open: boolean;
  onClose: () => void;
  initialCategory: GiftCategory | null;
  initialRecipient: Page | null;
}) {
  const router = useRouter();
  const { user, page: myPage } = useAuth();
  const { country } = useSettings();
  const { categories } = useGiftCategories();

  const [steps, setSteps] = useState<Step[]>([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [category, setCategory] = useState<GiftCategory | null>(initialCategory);
  const [recipient, setRecipient] = useState<Page | null>(initialRecipient);
  const [amount, setAmount] = useState(initialCategory?.min_amount ?? 0);
  const [sender, setSender] = useState<SenderProfile>(loadSenderProfile());
  const [note, setNote] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverWhatsapp, setReceiverWhatsapp] = useState("");
  const [invitingBusy, setInvitingBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCategory(initialCategory);
    setRecipient(initialRecipient);
    setAmount(initialCategory?.min_amount ?? 0);
    setSender(loadSenderProfile());
    setNote("");
    setReceiverName("");
    setReceiverWhatsapp("");

    const needsCategory = !initialCategory;
    const needsRecipient = !initialRecipient;

    const s: Step[] = [];
    // A fully generic open (e.g. the Hero "Send Surprise" button) leads with
    // who it's for, before asking what to send them.
    if (needsRecipient && needsCategory) s.push("recipient-type");
    if (needsCategory) s.push("category");
    s.push("amount");
    if (needsRecipient && !needsCategory) s.push("recipient-type");
    s.push("info", "payment", "processing", "success");
    setSteps(s);
    setStepIdx(0);
  }, [open, initialCategory, initialRecipient]);

  const step = steps[stepIdx];

  const floor = useMemo(() => {
    if (!category) return 0;
    const featured = recipient?.featured.find((f) => f.category_id === category.id);
    return featured?.min_amount ?? category.min_amount;
  }, [category, recipient]);

  const ceiling = useMemo(() => {
    if (!category) return floor;
    return Math.min(category.max_amount, roundToStep(floor * AMOUNT_MAX_MULTIPLIER));
  }, [category, floor]);

  function next() {
    sounds.tap();
    setStepIdx((i) => Math.min(i + 1, steps.length - 1));
  }
  function back() {
    sounds.tap();
    setStepIdx((i) => Math.max(i - 1, 0));
  }

  function selectCategory(c: GiftCategory) {
    setCategory(c);
    setAmount(c.min_amount);
    next();
  }

  function selectRecipient(p: Page) {
    setRecipient(p);
    router.push(`/p/${p.username}`);
    onClose();
  }

  function chooseHasPage() {
    setSteps((prev) => {
      const idx = prev.indexOf("recipient-type");
      if (idx === -1 || prev.includes("search")) return prev;
      const withSearch = [...prev];
      withSearch.splice(idx + 1, 0, "search");
      return withSearch;
    });
    next();
  }

  function chooseNoPage() {
    setSteps((prev) => {
      const idx = prev.indexOf("recipient-type");
      if (idx === -1) return prev;
      const infoIdx = prev.indexOf("info");
      // Keep any category/amount steps queued between recipient-type and
      // info (e.g. when opened generically, without a category yet).
      const middle = infoIdx === -1 ? [] : prev.slice(idx + 1, infoIdx);
      return [...prev.slice(0, idx + 1), ...middle, "invite", "invite-sending", "invite-success"];
    });
    next();
  }

  async function submitInvite() {
    if (!category || !user) return;
    if (!receiverName.trim() || !receiverWhatsapp.trim()) {
      toast.error("Add their name and WhatsApp number");
      sounds.error();
      return;
    }
    if (!sender.name.trim() || !sender.whatsapp.trim()) {
      toast.error("Add your name and WhatsApp number");
      sounds.error();
      return;
    }
    saveSenderProfile(sender);
    setInvitingBusy(true);
    setStepIdx(steps.indexOf("invite-sending"));
    try {
      await sendInvite({
        senderUid: user.uid,
        senderName: sender.name.trim(),
        senderWhatsapp: sender.whatsapp.trim(),
        receiverName: receiverName.trim(),
        receiverWhatsapp: receiverWhatsapp.trim(),
        category,
        amount,
        currency: country.currency,
        countryCode: country.code,
      });
      await new Promise((r) => setTimeout(r, 1500));
      sounds.success();
      setStepIdx(steps.indexOf("invite-success"));
    } catch {
      toast.error("Couldn't send the invite. Please try again.");
      sounds.error();
      setStepIdx(steps.indexOf("invite"));
    } finally {
      setInvitingBusy(false);
    }
  }

  function confirmInfo() {
    const effectiveName = myPage ? myPage.display_name : sender.name;
    const effectiveWhatsapp = myPage ? myPage.whatsapp : sender.whatsapp;
    if (!sender.anonymous && !effectiveName.trim()) {
      toast.error("Add your name, or send anonymously");
      sounds.error();
      return;
    }
    if (!effectiveWhatsapp.trim()) {
      toast.error("Add a WhatsApp number so we can process payment");
      sounds.error();
      return;
    }
    const resolved = { ...sender, name: effectiveName, whatsapp: effectiveWhatsapp };
    saveSenderProfile(resolved);
    setSender(resolved);
    next();
  }

  async function pay() {
    if (!category || !recipient || !user) return;
    setStepIdx(steps.indexOf("processing"));
    try {
      await new Promise((r) => setTimeout(r, 1900));
      await sendGift({
        senderUid: user.uid,
        category,
        amount,
        currency: country.currency,
        countryCode: country.code,
        city: country.city,
        recipient,
        sender,
        note,
      });
      sounds.success();
      setStepIdx(steps.indexOf("success"));
    } catch {
      toast.error("Payment failed. Please try again.");
      sounds.error();
      setStepIdx(steps.indexOf("payment"));
    }
  }

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between">
          {stepIdx > 0 && !OUTCOME_STEPS.includes(step) ? (
            <button
              onClick={back}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 hover:bg-border/60"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="h-3.5 w-3.5" />
            </button>
          ) : (
            <div className="h-8 w-8" />
          )}
          <div className="flex items-center gap-1.5">
            {steps
              .filter((s) => !OUTCOME_STEPS.includes(s))
              .map((s) => (
                <span
                  key={s}
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    steps.indexOf(s) <= stepIdx ? "bg-brand" : "bg-border"
                  }`}
                />
              ))}
          </div>
          {step !== "processing" && step !== "invite-sending" ? (
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 hover:bg-border/60"
            >
              <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5" />
            </button>
          ) : (
            <div className="h-8 w-8" />
          )}
        </div>

        {step === "category" && (
          <div>
            <h2 className="font-display text-lg font-semibold">What are you sending?</h2>
            <p className="mb-4 text-sm text-muted">Pick a surprise to send.</p>
            <div className="grid grid-cols-3 gap-2.5">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectCategory(c)}
                  className="flex flex-col items-center gap-1.5 rounded-2xl border border-border p-3 hover:bg-surface-2"
                >
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${COLOR_BG[c.color_key]}`}>
                    <FontAwesomeIcon icon={giftIcon(c.icon)} className={`h-4 w-4 ${COLOR_TEXT[c.color_key]}`} />
                  </span>
                  <span className="text-center text-[11px] font-semibold leading-tight">{c.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "amount" && category && (
          <div>
            <h2 className="font-display text-lg font-semibold">Choose {category.title} budget</h2>
            <p className="mb-4 text-sm text-muted">
              {recipient ? recipient.display_name.split(" ")[0] : "They"} can redeem this from partners
            </p>

            <div className="mb-4 flex items-center gap-3 rounded-2xl bg-brand-soft p-3">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${COLOR_BG[category.color_key]}`}>
                <FontAwesomeIcon icon={giftIcon(category.icon)} className={`h-4 w-4 ${COLOR_TEXT[category.color_key]}`} />
              </span>
              <span className="text-sm font-bold">{category.title}</span>
            </div>

            <div className="mb-2 flex items-center justify-center gap-4">
              <button
                onClick={() => setAmount((a) => Math.max(floor, roundToStep(a - 50)))}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 hover:bg-border/60"
              >
                <FontAwesomeIcon icon={faMinus} className="h-3.5 w-3.5" />
              </button>
              <span className="font-display text-3xl font-bold">
                {formatMoney(amount, country.currency)}
              </span>
              <button
                onClick={() => setAmount((a) => Math.min(ceiling, roundToStep(a + 50)))}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 hover:bg-border/60"
              >
                <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5" />
              </button>
            </div>

            <input
              type="range"
              className="fk-slider mb-1 w-full"
              min={floor}
              max={ceiling}
              step={50}
              value={amount}
              style={{
                ["--fk-slider-fill" as string]: `${((amount - floor) / (ceiling - floor || 1)) * 100}%`,
              }}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
            <div className="mb-4 flex justify-between text-[11px] text-muted">
              <span>Min {formatMoney(floor, country.currency)}</span>
              <span>Max {formatMoney(ceiling, country.currency)}</span>
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
              {amountChips(floor, ceiling).map((v) => (
                <button
                  key={v}
                  onClick={() => setAmount(v)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                    amount === v ? "border-brand bg-brand-soft text-brand" : "border-border"
                  }`}
                >
                  {formatMoney(v, country.currency)}
                </button>
              ))}
            </div>

            <button
              onClick={next}
              className="w-full rounded-2xl bg-ink py-[15px] font-display font-semibold text-white active:scale-[0.98]"
            >
              Continue
            </button>
          </div>
        )}

        {step === "recipient-type" && (
          <div>
            <h2 className="font-display text-lg font-semibold">Who&apos;s this for?</h2>
            <p className="mb-4 text-sm text-muted">Do they already have a Fykir page?</p>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={chooseHasPage}
                className="flex items-center gap-3 rounded-2xl border border-border p-4 text-left hover:bg-surface-2"
              >
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <FontAwesomeIcon icon={faUser} className="h-4 w-4" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-bold">Yes, they have a page</span>
                  <span className="block text-xs text-muted">Search for it and send straight to them</span>
                </span>
                <FontAwesomeIcon icon={faChevronRight} className="h-3.5 w-3.5 text-muted" />
              </button>
              <button
                onClick={chooseNoPage}
                className="flex items-center gap-3 rounded-2xl border border-border p-4 text-left hover:bg-surface-2"
              >
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-violet-soft text-violet">
                  <FontAwesomeIcon icon={faUserPlus} className="h-4 w-4" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-bold">Not yet</span>
                  <span className="block text-xs text-muted">We&apos;ll invite them over WhatsApp</span>
                </span>
                <FontAwesomeIcon icon={faChevronRight} className="h-3.5 w-3.5 text-muted" />
              </button>
            </div>
          </div>
        )}

        {step === "search" && (
          <div>
            <h2 className="mb-1 font-display text-lg font-semibold">Who&apos;s this for?</h2>
            <p className="mb-4 text-sm text-muted">Search for their Fykir page.</p>
            <SearchResults onSelect={selectRecipient} />
          </div>
        )}

        {step === "invite" && category && (
          <div>
            <h2 className="font-display text-lg font-semibold">Invite them to Fykir</h2>
            <p className="mb-4 text-sm text-muted">
              We&apos;ll send a WhatsApp message so they can set up a page and receive your{" "}
              {category.title} surprise.
            </p>

            <label className="mb-1 block text-xs font-bold text-muted">Their name</label>
            <input
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              placeholder="e.g. Amina"
              className="mb-3 w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm outline-none"
            />

            <label className="mb-1 block text-xs font-bold text-muted">Their WhatsApp number</label>
            <input
              value={receiverWhatsapp}
              onChange={(e) => setReceiverWhatsapp(e.target.value)}
              placeholder="07xx xxx xxx"
              className="mb-3 w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm outline-none"
            />

            {(!sender.name.trim() || !sender.whatsapp.trim()) && (
              <>
                <div className="my-4 h-px bg-border" />
                <p className="mb-3 text-xs font-bold text-muted">
                  Your details, so we can let you know when they&apos;re ready
                </p>

                {!sender.name.trim() && (
                  <>
                    <label className="mb-1 block text-xs font-bold text-muted">Your name</label>
                    <input
                      value={sender.name}
                      onChange={(e) => setSender((s) => ({ ...s, name: e.target.value }))}
                      placeholder="e.g. Amina"
                      className="mb-3 w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm outline-none"
                    />
                  </>
                )}

                {!sender.whatsapp.trim() && (
                  <>
                    <label className="mb-1 block text-xs font-bold text-muted">Your WhatsApp number</label>
                    <input
                      value={sender.whatsapp}
                      onChange={(e) => setSender((s) => ({ ...s, whatsapp: e.target.value }))}
                      placeholder="07xx xxx xxx"
                      className="mb-3 w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm outline-none"
                    />
                  </>
                )}
              </>
            )}

            <button
              onClick={submitInvite}
              disabled={invitingBusy}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-[15px] font-display font-semibold text-white active:scale-[0.98] disabled:opacity-60"
            >
              <FontAwesomeIcon icon={faPaperPlane} className="h-3.5 w-3.5" />
              Send invite
            </button>
          </div>
        )}

        {step === "invite-sending" && (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="relative mb-6 flex h-20 w-20 items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-violet-soft animate-ring-out" />
              <span className="absolute inset-0 rounded-full bg-violet-soft animate-ring-out [animation-delay:0.6s]" />
              <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-violet text-white">
                <FontAwesomeIcon icon={faCircleNotch} className="h-6 w-6 animate-spin" />
              </span>
            </div>
            <p className="font-display text-lg font-semibold">Sending invite…</p>
            <p className="mt-1 text-sm text-muted">
              Letting {receiverName.split(" ")[0] || "them"} know on WhatsApp
            </p>
          </div>
        )}

        {step === "invite-success" && (
          <div className="py-2 text-center">
            <p className="mb-1 font-display text-2xl font-bold">Invite sent! 🎉</p>
            <p className="mb-5 text-sm text-muted">
              We messaged {receiverWhatsapp} on WhatsApp inviting them to create a Fykir page.
              We&apos;ll let you know at {sender.whatsapp} the moment they&apos;re ready so you can
              send your {category?.title} surprise.
            </p>

            <button
              onClick={onClose}
              className="w-full rounded-2xl border border-border py-[15px] font-display font-semibold active:scale-[0.98]"
            >
              Done
            </button>
          </div>
        )}

        {step === "info" && category && (
          <div>
            <h2 className="font-display text-lg font-semibold">
              {myPage ? "Sending as you" : "Who's this gift from?"}
            </h2>
            <p className="mb-4 text-sm text-muted">
              {recipient?.display_name} will see this when they open your surprise.
            </p>

            {myPage ? (
              <div className="mb-3 flex items-center gap-3 rounded-xl border border-border px-3.5 py-2.5">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand">
                  {initials(myPage.display_name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">
                    Sending as {sender.anonymous ? sender.alias ?? ANON_ALIASES[0] : myPage.display_name}
                  </span>
                  <span className="block text-xs text-muted">M-Pesa: {myPage.whatsapp}</span>
                </span>
              </div>
            ) : (
              <>
                <label className="mb-1 block text-xs font-bold text-muted">Your name</label>
                <input
                  value={sender.name}
                  onChange={(e) => setSender((s) => ({ ...s, name: e.target.value }))}
                  disabled={sender.anonymous}
                  placeholder="e.g. Amina"
                  className="mb-3 w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm outline-none disabled:opacity-50"
                />

                <label className="mb-1 block text-xs font-bold text-muted">
                  WhatsApp number (for payment)
                </label>
                <input
                  value={sender.whatsapp}
                  onChange={(e) => setSender((s) => ({ ...s, whatsapp: e.target.value }))}
                  placeholder="07xx xxx xxx"
                  className="mb-3 w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm outline-none"
                />
              </>
            )}

            <div className="mb-3 flex items-center justify-between rounded-xl border border-border px-3.5 py-2.5">
              <span className="text-sm font-semibold">Send anonymously</span>
              <button
                onClick={() =>
                  setSender((s) => ({ ...s, anonymous: !s.anonymous, alias: s.alias ?? ANON_ALIASES[0] }))
                }
                className={`relative inline-flex h-6 w-[42px] flex-shrink-0 rounded-full transition-colors ${
                  sender.anonymous ? "bg-brand" : "bg-border"
                }`}
              >
                <span
                  className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all"
                  style={{ left: sender.anonymous ? 20 : 2 }}
                />
              </button>
            </div>

            {sender.anonymous && (
              <div className="mb-3 flex flex-wrap gap-2">
                {ANON_ALIASES.map((a) => (
                  <button
                    key={a}
                    onClick={() => setSender((s) => ({ ...s, alias: a }))}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                      sender.alias === a ? "border-brand bg-brand-soft text-brand" : "border-border"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            )}

            <label className="mb-1 block text-xs font-bold text-muted">
              Add a note (optional) · {note.length}/200
            </label>
            <textarea
              value={note}
              maxLength={200}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Say something sweet..."
              rows={3}
              className="mb-4 w-full resize-none rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm outline-none"
            />

            <button
              onClick={confirmInfo}
              className="w-full rounded-2xl bg-ink py-[15px] font-display font-semibold text-white active:scale-[0.98]"
            >
              Continue
            </button>
          </div>
        )}

        {step === "payment" && category && (
          <div>
            <h2 className="font-display text-lg font-semibold">Choose payment method</h2>
            <p className="mb-4 text-sm text-muted">
              You&apos;re sending {formatMoney(amount, country.currency)} to @{recipient?.username}
            </p>

            <div className="mb-3 flex items-center gap-3 rounded-2xl border-2 border-green bg-green-soft p-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-green text-white">
                <FontAwesomeIcon icon={faCheck} className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-bold">M-Pesa</p>
                <p className="text-xs text-muted">STK push to your phone</p>
              </div>
            </div>
            <p className="mb-4 text-xs text-muted">
              Demo mode — payment is simulated, no real charge.
            </p>

            <div className="mb-5 flex items-center justify-between rounded-2xl border border-border p-4 opacity-50">
              <div>
                <p className="text-sm font-bold">Card</p>
                <p className="text-xs text-muted">Visa, Mastercard</p>
              </div>
              <span className="rounded-full bg-yellow px-2 py-0.5 text-[10px] font-bold text-ink/70">
                SOON
              </span>
            </div>

            <button
              onClick={pay}
              className="w-full rounded-2xl bg-brand py-[15px] font-display font-semibold text-white shadow-[0_8px_20px_-6px_var(--brand)] active:scale-[0.98]"
            >
              Pay {formatMoney(amount, country.currency)}
            </button>
          </div>
        )}

        {step === "processing" && (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="relative mb-6 flex h-20 w-20 items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-green-soft animate-ring-out" />
              <span className="absolute inset-0 rounded-full bg-green-soft animate-ring-out [animation-delay:0.6s]" />
              <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-green text-white">
                <FontAwesomeIcon icon={faCircleNotch} className="h-6 w-6 animate-spin" />
              </span>
            </div>
            <p className="font-display text-lg font-semibold">Check your phone…</p>
            <p className="mt-1 text-sm text-muted">
              We sent an M-Pesa payment request for {formatMoney(amount, country.currency)} to{" "}
              {sender.whatsapp}
            </p>
          </div>
        )}

        {step === "success" && category && (
          <div className="py-2 text-center">
            <p className="mb-1 font-display text-2xl font-bold">Gift sent! 🎉</p>
            <p className="mb-5 text-sm text-muted">
              Your {formatMoney(amount, country.currency)} {category.title} voucher is on the way to{" "}
              {recipient?.display_name.split(" ")[0]}.
            </p>

            <button
              onClick={onClose}
              className="w-full rounded-2xl border border-border py-[15px] font-display font-semibold active:scale-[0.98]"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </Sheet>
  );
}
