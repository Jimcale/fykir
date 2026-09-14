"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera, faCircleNotch, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { getDoc, updateDoc } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Header } from "@/components/Header";
import { useAuth } from "@/lib/auth-context";
import { useGiftCategories } from "@/lib/data-hooks";
import { pageRef } from "@/lib/firebase/collections";
import { ACCENT_PRESETS, COLOR_BG, COLOR_TEXT, COVER_PRESETS, formatMoney, initials } from "@/lib/catalog";
import { giftIcon } from "@/lib/icons";
import { uploadPageImage } from "@/lib/storage";
import { useSettings } from "@/lib/settings-context";
import { sounds } from "@/lib/sounds";
import type { FeaturedGift, GiftCategory, Page } from "@/lib/types";

export default function EditPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { country } = useSettings();
  const { categories } = useGiftCategories();

  const [status, setStatus] = useState<"loading" | "not-found" | "forbidden" | "ready">("loading");
  const [submitting, setSubmitting] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [birthday, setBirthday] = useState("");
  const [bio, setBio] = useState("");
  const [featured, setFeatured] = useState<FeaturedGift[]>([]);
  const [accent, setAccent] = useState(ACCENT_PRESETS[0]);
  const [coverGradient, setCoverGradient] = useState<[string, string]>(COVER_PRESETS[0]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    getDoc(pageRef(username)).then((snap) => {
      if (cancelled) return;
      if (!snap.exists()) {
        setStatus("not-found");
        return;
      }
      const data: Page = snap.data();
      if (!user || data.owner_uid !== user.uid) {
        setStatus("forbidden");
        return;
      }
      setDisplayName(data.display_name);
      setWhatsapp(data.whatsapp);
      setEmail(data.email);
      setBirthday(data.birthday ?? "");
      setBio(data.bio);
      setFeatured(data.featured);
      setAccent(data.accent_color);
      setCoverGradient(data.cover_gradient ?? COVER_PRESETS[0]);
      setAvatarUrl(data.avatar_url);
      setCoverUrl(data.cover_url);
      setStatus("ready");
    });
    return () => {
      cancelled = true;
    };
  }, [username, user, authLoading]);

  function toggleFeatured(category: GiftCategory) {
    sounds.tap();
    setFeatured((prev) => {
      const exists = prev.find((f) => f.category_id === category.id);
      if (exists) return prev.filter((f) => f.category_id !== category.id);
      return [...prev, { category_id: category.id, min_amount: category.min_amount }];
    });
  }

  function canSave() {
    return displayName.trim().length >= 2 && whatsapp.trim().length >= 7;
  }

  async function handleSubmit() {
    if (!user || !canSave()) return;
    setSubmitting(true);
    try {
      let nextAvatarUrl = avatarUrl;
      let nextCoverUrl = coverUrl;
      if (avatarFile) nextAvatarUrl = await uploadPageImage(user.uid, "avatar", avatarFile);
      if (coverFile) nextCoverUrl = await uploadPageImage(user.uid, "cover", coverFile);

      await updateDoc(pageRef(username), {
        display_name: displayName.trim(),
        whatsapp: whatsapp.trim(),
        email: email.trim(),
        birthday: birthday || null,
        bio: bio.trim(),
        avatar_url: nextAvatarUrl,
        cover_url: nextCoverUrl,
        accent_color: accent,
        cover_gradient: coverGradient,
        featured,
      });

      sounds.success();
      toast.success("Your page is updated!");
      router.push(`/p/${username}`);
    } catch (err) {
      console.error(err);
      sounds.error();
      toast.error("Couldn't save your changes. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <FontAwesomeIcon icon={faCircleNotch} className="h-6 w-6 animate-spin text-muted" />
        </div>
      </div>
    );
  }

  if (status === "not-found") {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-5 text-center">
          <p className="font-display text-xl font-bold">Page not found</p>
          <p className="text-sm text-muted">@{username} doesn&apos;t have a Fykir page yet.</p>
        </div>
      </div>
    );
  }

  if (status === "forbidden") {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-5 text-center">
          <p className="font-display text-xl font-bold">You can&apos;t edit this page</p>
          <p className="text-sm text-muted">Only @{username} can make changes here.</p>
          <Link href={`/p/${username}`} className="mt-3 text-xs font-bold text-brand">
            Back to page
          </Link>
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
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Edit your page</h1>
            <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">
              Update your details, wishlist and style. Your username stays @{username}.
            </p>
          </div>

          <div className="rounded-[28px] border border-border bg-surface p-5 shadow-sm sm:p-7">
            <section>
              <h2 className="font-display text-lg font-semibold">About you</h2>
              <div className="mt-4 flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Display name">
                    <input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Amina Wanjiru"
                      className="fk-input"
                    />
                  </Field>
                  <Field label="WhatsApp number">
                    <input
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="07xx xxx xxx"
                      className="fk-input"
                    />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Email (optional)">
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      type="email"
                      className="fk-input"
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
            </section>

            <div className="my-7 h-px bg-border" />

            <section>
              <h2 className="font-display text-lg font-semibold">Wishlist</h2>
              <p className="mt-1 mb-1 text-sm text-muted">
                Pick a few surprise vouchers to feature on your page.
              </p>
              <p className="mb-4 text-xs font-bold text-brand">
                {featured.length > 0 ? `${featured.length} selected` : "None selected yet"}
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
                      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${COLOR_BG[c.color_key]}`}>
                        <FontAwesomeIcon icon={giftIcon(c.icon)} className={`h-4 w-4 ${COLOR_TEXT[c.color_key]}`} />
                      </span>
                      <span className="text-center text-[11px] font-semibold leading-tight">{c.title}</span>
                      <span className="text-[10px] text-muted">
                        From {formatMoney(c.min_amount, country.currency)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="my-7 h-px bg-border" />

            <section>
              <h2 className="font-display text-lg font-semibold">Style</h2>
              <p className="mt-1 mb-4 text-sm text-muted">
                Update your photo, cover and page color.
              </p>

              <p className="mb-2 text-xs font-bold text-muted">Cover &amp; profile photo</p>
              <div
                className="relative mb-4 h-36 w-full overflow-hidden rounded-2xl border border-border"
                style={{
                  background:
                    coverPreview || coverUrl
                      ? undefined
                      : `linear-gradient(135deg, ${coverGradient[0]}, ${coverGradient[1]})`,
                }}
              >
                {(coverPreview || coverUrl) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverPreview ?? coverUrl ?? ""} alt="" className="h-full w-full object-cover" />
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
                    background:
                      avatarPreview || avatarUrl
                        ? undefined
                        : `linear-gradient(135deg, ${coverGradient[0]}, ${coverGradient[1]})`,
                  }}
                >
                  {avatarPreview || avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarPreview ?? avatarUrl ?? ""} alt="" className="h-full w-full object-cover" />
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
            </section>

            <div className="mt-8 flex gap-3">
              <Link
                href={`/p/${username}`}
                className="flex h-[52px] flex-1 items-center justify-center rounded-2xl border border-border font-display font-semibold"
              >
                Cancel
              </Link>
              <button
                onClick={handleSubmit}
                disabled={submitting || !canSave()}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-brand py-[15px] font-display font-semibold text-white shadow-[0_8px_20px_-6px_var(--brand)] transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                {submitting && <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin" />}
                Save changes
              </button>
            </div>
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
