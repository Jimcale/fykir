"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faCamera,
  faCheck,
  faCircleNotch,
  faGift,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CategoryIcon } from "@/components/CategoryIcon";
import { CityAutosuggest } from "@/components/CityAutosuggest";
import { Header } from "@/components/Header";
import { useAuth } from "@/lib/auth-context";
import { citiesForCountry } from "@/lib/cities";
import { useGiftCategories } from "@/lib/data-hooks";
import { pageRef } from "@/lib/firebase/collections";
import { ACCENT_PRESETS, COLOR_BG, COLOR_TEXT, COVER_PRESETS, formatMoney, initials } from "@/lib/catalog";
import { uploadPageImage } from "@/lib/storage";
import { useSendFlow } from "@/lib/send-flow-context";
import { useSettings } from "@/lib/settings-context";
import { sounds } from "@/lib/sounds";
import type { FeaturedGift, GiftCategory } from "@/lib/types";

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export default function CreatePage() {
  const router = useRouter();
  const { user, page, pageLoading } = useAuth();
  const { country, isSupportedCountry } = useSettings();
  const { open: openSendFlow } = useSendFlow();
  const { categories } = useGiftCategories();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // step 1
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [birthday, setBirthday] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">(
    "idle"
  );

  // step 2
  const [featured, setFeatured] = useState<FeaturedGift[]>([]);

  // step 3
  const [accent, setAccent] = useState(ACCENT_PRESETS[0]);
  const [coverGradient, setCoverGradient] = useState<[string, string]>(COVER_PRESETS[0]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!pageLoading && page) {
      router.replace(`/p/${page.username}`);
    }
  }, [pageLoading, page, router]);

  useEffect(() => {
    const clean = username.trim().toLowerCase();
    if (!USERNAME_RE.test(clean)) {
      setUsernameStatus("idle");
      return;
    }
    setUsernameStatus("checking");
    const t = setTimeout(async () => {
      const { getDoc } = await import("firebase/firestore");
      const snap = await getDoc(pageRef(clean));
      setUsernameStatus(snap.exists() ? "taken" : "available");
    }, 400);
    return () => clearTimeout(t);
  }, [username]);

  function toggleFeatured(category: GiftCategory) {
    sounds.tap();
    setFeatured((prev) => {
      const exists = prev.find((f) => f.category_id === category.id);
      if (exists) return prev.filter((f) => f.category_id !== category.id);
      return [...prev, { category_id: category.id, min_amount: category.min_amount }];
    });
  }

  function canContinueStep1() {
    return (
      displayName.trim().length >= 2 &&
      USERNAME_RE.test(username.trim().toLowerCase()) &&
      usernameStatus === "available" &&
      whatsapp.trim().length >= 7
    );
  }

  async function handleSubmit() {
    if (!user) return;
    setSubmitting(true);
    try {
      let avatarUrl: string | null = null;
      let coverUrl: string | null = null;
      if (avatarFile) avatarUrl = await uploadPageImage(user.uid, "avatar", avatarFile);
      if (coverFile) coverUrl = await uploadPageImage(user.uid, "cover", coverFile);

      const clean = username.trim().toLowerCase();
      await setDoc(doc(db, "pages", clean), {
        username: clean,
        display_name: displayName.trim(),
        whatsapp: whatsapp.trim(),
        email: email.trim(),
        birthday: birthday || null,
        city: city.trim() || null,
        bio: bio.trim(),
        avatar_url: avatarUrl,
        cover_url: coverUrl,
        accent_color: accent,
        cover_gradient: coverGradient,
        featured,
        owner_uid: user.uid,
        country_code: country.code,
        created_at: serverTimestamp(),
      });

      sounds.success();
      toast.success("Your Fykir page is live!");
      router.push(`/p/${clean}`);
    } catch (err) {
      console.error(err);
      sounds.error();
      toast.error("Couldn't create your page. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const STEP_LABELS = ["About you", "Wishlist", "Style"];

  if (!pageLoading && !page && !isSupportedCountry) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <span className="text-5xl">🌍</span>
          <h1 className="font-display text-xl font-bold">Not available in your location yet</h1>
          <p className="max-w-sm text-sm text-muted">
            Receiving gifts on Fykir isn&apos;t supported in your country yet, so you can&apos;t
            create a page right now. You can still send a surprise to someone who has one.
          </p>
          <button
            onClick={() => {
              sounds.tap();
              openSendFlow();
            }}
            className="mt-2 flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-2.5 font-display text-sm font-semibold text-white shadow-[0_6px_16px_-6px_var(--brand)]"
          >
            <FontAwesomeIcon icon={faGift} className="h-3.5 w-3.5" />
            Send a gift instead
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="relative flex-1 overflow-hidden px-5 py-10 sm:py-14">
        <div className="animate-float-blob pointer-events-none absolute -top-16 left-[6%] h-44 w-44 rounded-full bg-brand-soft blur-3xl" />
        <div className="animate-float-blob pointer-events-none absolute top-16 right-[6%] h-36 w-36 rounded-full bg-violet-soft blur-3xl [animation-delay:1s]" />

        <div className="relative mx-auto w-full max-w-lg">
          <div className="mb-6 text-center">
            <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
              <FontAwesomeIcon icon={faGift} className="h-5 w-5" />
            </span>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Create your Fykir page</h1>
            <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">
              Set it up once — share your link so people know exactly what to surprise you with.
            </p>
          </div>

          <div className="animate-pop-in rounded-[28px] border border-border bg-surface p-5 shadow-sm sm:p-7">
            <div className="mb-7">
              <div className="mb-2.5 flex items-center">
                {STEP_LABELS.map((label, i) => (
                  <div key={label} className="flex flex-1 items-center last:flex-none">
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                          i < step
                            ? "bg-green text-white"
                            : i === step
                              ? "bg-brand text-white"
                              : "bg-surface-2 text-muted"
                        }`}
                      >
                        {i < step ? <FontAwesomeIcon icon={faCheck} className="h-2.5 w-2.5" /> : i + 1}
                      </span>
                      <span
                        className={`hidden text-xs font-bold sm:block ${
                          i === step ? "text-ink" : "text-muted"
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                    {i < STEP_LABELS.length - 1 && (
                      <span className="mx-2.5 h-px flex-1 bg-border" />
                    )}
                  </div>
                ))}
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-brand transition-all"
                  style={{ width: `${((step + 1) / 3) * 100}%` }}
                />
              </div>
            </div>

            {step === 0 && (
              <div>
                <h2 className="font-display text-lg font-semibold">Let&apos;s set up your page</h2>
                <p className="mt-1 mb-6 text-sm text-muted">
                  This is how people will find and gift you.
                </p>

                <div className="flex flex-col gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Display name">
                      <input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g. Amina Wanjiru"
                        className="fk-input"
                      />
                    </Field>

                    <Field label="Username">
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted">
                          @
                        </span>
                        <input
                          value={username}
                          onChange={(e) =>
                            setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                          }
                          placeholder="username"
                          className="fk-input pl-7 pr-9"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold">
                          {usernameStatus === "checking" && (
                            <FontAwesomeIcon
                              icon={faCircleNotch}
                              className="h-3.5 w-3.5 animate-spin text-muted"
                            />
                          )}
                          {usernameStatus === "available" && (
                            <FontAwesomeIcon icon={faCheck} className="h-3.5 w-3.5 text-green" />
                          )}
                          {usernameStatus === "taken" && <span className="text-brand">Taken</span>}
                        </span>
                      </div>
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="WhatsApp number">
                      <input
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="07xx xxx xxx"
                        className="fk-input"
                      />
                    </Field>

                    <Field label="Email (optional)">
                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        type="email"
                        className="fk-input"
                      />
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="City (optional)">
                      <CityAutosuggest
                        value={city}
                        onChange={setCity}
                        suggestions={citiesForCountry(country.code)}
                      />
                    </Field>

                    <Field label="Birthday (optional)">
                      <input
                        value={birthday}
                        onChange={(e) => setBirthday(e.target.value)}
                        type="date"
                        className="fk-input"
                      />
                    </Field>
                  </div>

                  <Field label="Bio (optional)">
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={2}
                      placeholder="Tell people a little about yourself"
                      className="fk-input resize-none"
                    />
                  </Field>
                </div>

                <button
                  disabled={!canContinueStep1()}
                  onClick={() => {
                    sounds.tap();
                    setStep(1);
                  }}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-[15px] font-display font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-40"
                >
                  Continue
                  <FontAwesomeIcon icon={faArrowRight} className="h-4 w-4" />
                </button>
              </div>
            )}

            {step === 1 && (
              <div>
                <h2 className="font-display text-lg font-semibold">What would you love to receive?</h2>
                <p className="mt-1 mb-1 text-sm text-muted">
                  Pick a few surprise vouchers to feature. You can change these later.
                </p>
                <p className="mb-5 text-xs font-bold text-brand">
                  {featured.length > 0
                    ? `${featured.length} selected`
                    : "You can also skip this and add favorites later"}
                </p>

                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {categories.map((c) => {
                    const selected = featured.some((f) => f.category_id === c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => toggleFeatured(c)}
                        className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 transition-colors ${
                          selected ? "border-brand bg-brand-soft" : "border-border hover:bg-surface-2"
                        }`}
                      >
                        <span className={`flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl ${COLOR_BG[c.color_key]}`}>
                          <CategoryIcon icon={c.icon} imageUrl={c.image_url} className={`h-4 w-4 ${COLOR_TEXT[c.color_key]}`} />
                        </span>
                        <span className="text-center text-[11px] font-semibold leading-tight">{c.title}</span>
                        <span className="text-[10px] text-muted">
                          From {formatMoney(c.min_amount, country.currency)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setStep(0)}
                    className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-2xl border border-border"
                  >
                    <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      sounds.tap();
                      setStep(2);
                    }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-ink py-[15px] font-display font-semibold text-white transition-transform active:scale-[0.98]"
                  >
                    Continue
                    <FontAwesomeIcon icon={faArrowRight} className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="font-display text-lg font-semibold">Make it feel like you</h2>
                <p className="mt-1 mb-5 text-sm text-muted">
                  Add a photo, a cover and pick your page color.
                </p>

                <p className="mb-2 text-xs font-bold text-muted">Cover &amp; profile photo</p>
                <div
                  className="relative mb-4 h-36 w-full overflow-hidden rounded-2xl border border-border"
                  style={{
                    background: coverPreview
                      ? undefined
                      : `linear-gradient(135deg, ${coverGradient[0]}, ${coverGradient[1]})`,
                  }}
                >
                  {coverPreview && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coverPreview} alt="" className="h-full w-full object-cover" />
                  )}
                  <label className="absolute bottom-2 right-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-ink/60 text-white backdrop-blur transition-colors hover:bg-ink/75">
                    <FontAwesomeIcon icon={faCamera} className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        setCoverFile(f);
                        setCoverPreview(URL.createObjectURL(f));
                      }}
                    />
                  </label>

                  <div
                    className="absolute -bottom-9 left-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-surface font-display text-lg font-semibold text-white shadow-sm"
                    style={{
                      background: avatarPreview
                        ? undefined
                        : `linear-gradient(135deg, ${coverGradient[0]}, ${coverGradient[1]})`,
                    }}
                  >
                    {avatarPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initials(displayName || "You")
                    )}
                    <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-ink/0 transition-colors hover:bg-ink/30">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          setAvatarFile(f);
                          setAvatarPreview(URL.createObjectURL(f));
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="mt-11 mb-2 text-xs font-bold text-muted">Page color</div>
                <div className="mb-2 flex gap-2.5">
                  {ACCENT_PRESETS.map((c, i) => (
                    <button
                      key={c}
                      onClick={() => {
                        setAccent(c);
                        setCoverGradient(COVER_PRESETS[i % COVER_PRESETS.length]);
                      }}
                      className="h-10 w-10 rounded-full transition-transform active:scale-90"
                      style={{
                        background: c,
                        boxShadow: accent === c ? `0 0 0 2.5px var(--surface), 0 0 0 4px ${c}` : undefined,
                      }}
                    />
                  ))}
                </div>

                <div className="mt-8 flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-2xl border border-border"
                  >
                    <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-brand py-[15px] font-display font-semibold text-white shadow-[0_8px_20px_-6px_var(--brand)] transition-transform active:scale-[0.98] disabled:opacity-60"
                  >
                    {submitting && <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin" />}
                    Create my page
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold text-muted">{label}</label>
      {children}
    </div>
  );
}
