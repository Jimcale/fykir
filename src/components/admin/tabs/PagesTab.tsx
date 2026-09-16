"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera, faIdCard } from "@fortawesome/free-solid-svg-icons";
import { deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { db } from "@/lib/firebase/client";
import { pagesCol } from "@/lib/firebase/collections";
import { useGiftCategories } from "@/lib/data-hooks";
import { useSettings } from "@/lib/settings-context";
import { citiesForCountry } from "@/lib/cities";
import { CategoryIcon } from "@/components/CategoryIcon";
import { CityAutosuggest } from "@/components/CityAutosuggest";
import { ACCENT_PRESETS, COLOR_BG, COLOR_TEXT, COVER_PRESETS, initials } from "@/lib/catalog";
import { uploadPageImage } from "@/lib/storage";
import { sounds } from "@/lib/sounds";
import { Drawer } from "@/components/ui/Drawer";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import {
  AddButton,
  AdminSearchInput,
  EmptyState,
  Field,
  FormFooter,
  RowActions,
  TabHeader,
} from "@/components/admin/Shared";
import type { FeaturedGift, Page } from "@/lib/types";

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

function emptyForm() {
  return {
    username: "",
    owner_uid: "",
    display_name: "",
    whatsapp: "",
    email: "",
    birthday: "",
    city: "",
    bio: "",
    accent_color: ACCENT_PRESETS[0],
    cover_gradient: COVER_PRESETS[0] as [string, string],
    country_code: "KE",
    featured: [] as FeaturedGift[],
  };
}

export function PagesTab() {
  const { categories } = useGiftCategories();
  const { countries } = useSettings();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Page | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Page | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    const snap = await getDocs(query(pagesCol, orderBy("created_at", "desc")));
    setPages(snap.docs.map((d) => d.data()));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return pages;
    return pages.filter((p) => `${p.username} ${p.display_name} ${p.city ?? ""}`.toLowerCase().includes(term));
  }, [pages, q]);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm());
    setAvatarFile(null);
    setAvatarPreview(null);
    setCoverFile(null);
    setCoverPreview(null);
    setDrawerOpen(true);
  }

  function openEdit(p: Page) {
    setEditing(p);
    setForm({
      username: p.username,
      owner_uid: p.owner_uid,
      display_name: p.display_name,
      whatsapp: p.whatsapp,
      email: p.email,
      birthday: p.birthday ?? "",
      city: p.city ?? "",
      bio: p.bio,
      accent_color: p.accent_color,
      cover_gradient: p.cover_gradient ?? COVER_PRESETS[0],
      country_code: p.country_code,
      featured: p.featured,
    });
    setAvatarFile(null);
    setAvatarPreview(p.avatar_url);
    setCoverFile(null);
    setCoverPreview(p.cover_url);
    setDrawerOpen(true);
  }

  function toggleFeatured(id: string, minAmount: number) {
    setForm((f) => {
      const exists = f.featured.some((x) => x.category_id === id);
      return {
        ...f,
        featured: exists
          ? f.featured.filter((x) => x.category_id !== id)
          : [...f.featured, { category_id: id, min_amount: minAmount }],
      };
    });
  }

  async function save() {
    const username = editing ? editing.username : form.username.trim().toLowerCase();
    if (!editing) {
      if (!USERNAME_RE.test(username)) {
        toast.error("Username must be 3-20 lowercase letters, numbers or underscores");
        return;
      }
      if (!form.owner_uid.trim()) {
        toast.error("Add the owner's uid (find it in the Users tab)");
        return;
      }
      if (pages.some((p) => p.username === username)) {
        toast.error("That username is taken");
        return;
      }
    }
    if (!form.display_name.trim() || form.whatsapp.trim().length < 7) {
      toast.error("Add a display name and WhatsApp number");
      return;
    }
    setSaving(true);
    try {
      const uidForUpload = editing ? editing.owner_uid : form.owner_uid.trim();
      let avatarUrl = editing?.avatar_url ?? null;
      let coverUrl = editing?.cover_url ?? null;
      if (avatarFile) avatarUrl = await uploadPageImage(uidForUpload, "avatar", avatarFile);
      if (coverFile) coverUrl = await uploadPageImage(uidForUpload, "cover", coverFile);

      const data = {
        username,
        display_name: form.display_name.trim(),
        whatsapp: form.whatsapp.trim(),
        email: form.email.trim(),
        birthday: form.birthday || null,
        city: form.city.trim() || null,
        bio: form.bio.trim(),
        avatar_url: avatarUrl,
        cover_url: coverUrl,
        accent_color: form.accent_color,
        cover_gradient: form.cover_gradient,
        featured: form.featured,
        country_code: form.country_code,
      };

      if (editing) {
        await updateDoc(doc(db, "pages", username), data);
      } else {
        await setDoc(doc(db, "pages", username), {
          ...data,
          owner_uid: form.owner_uid.trim(),
          created_at: serverTimestamp(),
        });
      }
      sounds.success();
      toast.success(editing ? "Page updated" : "Page created");
      setDrawerOpen(false);
      load();
    } catch (err) {
      console.error(err);
      sounds.error();
      toast.error("Couldn't save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteDoc(doc(db, "pages", deleting.username));
      sounds.success();
      toast.success("Page deleted");
      setDeleting(null);
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
        title="User Pages"
        description="The public gifting pages people create."
        action={<AddButton label="Add Page" onClick={openAdd} />}
      />
      <AdminSearchInput value={q} onChange={setQ} placeholder="Search by username, name or city…" />

      {loading ? (
        <p className="py-10 text-center text-sm text-muted">Loading…</p>
      ) : filtered.length === 0 ? (
        <EmptyState icon={faIdCard} title="No pages found" />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3.5">
              <span
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full font-display text-xs font-semibold text-white"
                style={{
                  background: p.avatar_url
                    ? undefined
                    : `linear-gradient(135deg, ${p.cover_gradient?.[0] ?? p.accent_color}, ${p.cover_gradient?.[1] ?? p.accent_color})`,
                }}
              >
                {p.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials(p.display_name)
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{p.display_name}</p>
                <p className="truncate text-xs text-muted">
                  @{p.username} · {p.city ?? "—"}
                </p>
              </div>
              <Link href={`/p/${p.username}`} target="_blank" className="flex-shrink-0 text-xs font-bold text-brand">
                View
              </Link>
              <RowActions onEdit={() => openEdit(p)} onDelete={() => setDeleting(p)} />
            </div>
          ))}
        </div>
      )}

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? "Edit page" : "Add page"}
        subtitle={editing ? `@${editing.username}` : undefined}
        footer={
          <FormFooter
            onCancel={() => setDrawerOpen(false)}
            onSave={save}
            busy={saving}
            saveLabel={editing ? "Save changes" : "Create page"}
          />
        }
      >
        <div className="flex flex-col gap-4">
          <div
            className="relative h-28 w-full overflow-hidden rounded-2xl border border-border"
            style={{
              background: coverPreview
                ? undefined
                : `linear-gradient(135deg, ${form.cover_gradient[0]}, ${form.cover_gradient[1]})`,
            }}
          >
            {coverPreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverPreview} alt="" className="h-full w-full object-cover" />
            )}
            <label className="absolute bottom-2 right-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-ink/60 text-white">
              <FontAwesomeIcon icon={faCamera} className="h-3.5 w-3.5" />
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
              className="absolute -bottom-7 left-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-4 border-surface font-display text-sm font-semibold text-white"
              style={{
                background: avatarPreview
                  ? undefined
                  : `linear-gradient(135deg, ${form.cover_gradient[0]}, ${form.cover_gradient[1]})`,
              }}
            >
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
              ) : (
                initials(form.display_name || "?")
              )}
              <label className="absolute inset-0 flex cursor-pointer items-center justify-center hover:bg-ink/30">
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

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Field label="Display name">
              <input
                value={form.display_name}
                onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
                className="fk-input"
              />
            </Field>
            {editing ? (
              <Field label="Username">
                <input value={form.username} disabled className="fk-input opacity-60" />
              </Field>
            ) : (
              <Field label="Username">
                <input
                  value={form.username}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") }))
                  }
                  className="fk-input"
                  placeholder="username"
                />
              </Field>
            )}
          </div>

          {!editing && (
            <Field label="Owner uid (from the Users tab)">
              <input
                value={form.owner_uid}
                onChange={(e) => setForm((f) => ({ ...f, owner_uid: e.target.value.trim() }))}
                className="fk-input"
                placeholder="Firebase uid"
              />
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="WhatsApp">
              <input
                value={form.whatsapp}
                onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
                className="fk-input"
              />
            </Field>
            <Field label="Email">
              <input
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="fk-input"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="City">
              <CityAutosuggest
                value={form.city}
                onChange={(v) => setForm((f) => ({ ...f, city: v }))}
                suggestions={citiesForCountry(form.country_code)}
              />
            </Field>
            <Field label="Country">
              <select
                value={form.country_code}
                onChange={(e) => setForm((f) => ({ ...f, country_code: e.target.value }))}
                className="fk-input"
              >
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Bio">
            <textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              rows={2}
              className="fk-input resize-none"
            />
          </Field>

          <div>
            <p className="mb-2 text-xs font-bold text-muted">Featured surprises</p>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((c) => {
                const selected = form.featured.some((f) => f.category_id === c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleFeatured(c.id, c.min_amount)}
                    className={`flex flex-col items-center gap-1 rounded-xl border p-2 ${
                      selected ? "border-brand bg-brand-soft" : "border-border"
                    }`}
                  >
                    <span className={`flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg ${COLOR_BG[c.color_key]}`}>
                      <CategoryIcon icon={c.icon} imageUrl={c.image_url} className={`h-3.5 w-3.5 ${COLOR_TEXT[c.color_key]}`} />
                    </span>
                    <span className="text-center text-[10px] font-semibold leading-tight">{c.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold text-muted">Accent color</p>
            <div className="flex gap-2">
              {ACCENT_PRESETS.map((c, i) => (
                <button
                  key={c}
                  onClick={() =>
                    setForm((f) => ({ ...f, accent_color: c, cover_gradient: COVER_PRESETS[i % COVER_PRESETS.length] }))
                  }
                  className="h-8 w-8 rounded-full"
                  style={{
                    background: c,
                    boxShadow: form.accent_color === c ? `0 0 0 2px var(--surface), 0 0 0 3.5px ${c}` : undefined,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </Drawer>

      <ConfirmDialog
        open={!!deleting}
        title={`Delete @${deleting?.username}?`}
        description="Their page disappears; gifts already sent to them stay in history. This can't be undone."
        busy={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
