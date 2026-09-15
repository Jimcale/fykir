"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGift, faImage } from "@fortawesome/free-solid-svg-icons";
import { deleteDoc, doc, getDocs, orderBy, query, setDoc, updateDoc } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { db } from "@/lib/firebase/client";
import { giftCategoriesCol } from "@/lib/firebase/collections";
import { invalidateGiftCategoriesCache } from "@/lib/data-hooks";
import { COLOR_BG, COLOR_TEXT, formatMoney } from "@/lib/catalog";
import { GIFT_ICONS, giftIcon } from "@/lib/icons";
import { uploadCategoryImage } from "@/lib/storage";
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
import type { ColorKey, GiftCategory } from "@/lib/types";

const COLOR_KEYS: ColorKey[] = ["brand", "yellow", "green", "violet", "teal", "orange", "pink"];

function slugify(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function emptyForm() {
  return {
    id: "",
    title: "",
    icon: "mobile-screen",
    image_url: null as string | null,
    color_key: "brand" as ColorKey,
    min_amount: 500,
    max_amount: 5000,
    order: 1,
  };
}

export function CategoriesTab() {
  const [categories, setCategories] = useState<GiftCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<GiftCategory | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<GiftCategory | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    const snap = await getDocs(query(giftCategoriesCol, orderBy("order")));
    setCategories(snap.docs.map((d) => d.data()));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () => categories.filter((c) => c.title.toLowerCase().includes(q.trim().toLowerCase())),
    [categories, q]
  );

  function openAdd() {
    setEditing(null);
    setForm({ ...emptyForm(), order: categories.length + 1 });
    setImageFile(null);
    setImagePreview(null);
    setDrawerOpen(true);
  }

  function openEdit(c: GiftCategory) {
    setEditing(c);
    setForm({
      id: c.id,
      title: c.title,
      icon: c.icon,
      image_url: c.image_url,
      color_key: c.color_key,
      min_amount: c.min_amount,
      max_amount: c.max_amount,
      order: c.order,
    });
    setImageFile(null);
    setImagePreview(c.image_url);
    setDrawerOpen(true);
  }

  async function save() {
    const id = editing ? editing.id : slugify(form.id || form.title);
    if (!id || !form.title.trim()) {
      toast.error("Add a title");
      return;
    }
    if (!editing && categories.some((c) => c.id === id)) {
      toast.error("That id is already used");
      return;
    }
    setSaving(true);
    try {
      let imageUrl = form.image_url;
      if (imageFile) imageUrl = await uploadCategoryImage(id, imageFile);
      const data = {
        title: form.title.trim(),
        icon: form.icon,
        image_url: imageUrl,
        color_key: form.color_key,
        min_amount: Number(form.min_amount),
        max_amount: Number(form.max_amount),
        order: Number(form.order),
      };
      if (editing) {
        await updateDoc(doc(db, "gift_categories", id), data);
      } else {
        await setDoc(doc(db, "gift_categories", id), data);
      }
      invalidateGiftCategoriesCache();
      sounds.success();
      toast.success(editing ? "Category updated" : "Category added");
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
      await deleteDoc(doc(db, "gift_categories", deleting.id));
      invalidateGiftCategoriesCache();
      sounds.success();
      toast.success("Category deleted");
      setDeleting(null);
      load();
    } catch {
      sounds.error();
      toast.error("Couldn't delete. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <TabHeader
        title="Gift Categories"
        description="The surprise types people can send — airtime, cake, flowers…"
        action={<AddButton label="Add Category" onClick={openAdd} />}
      />
      <AdminSearchInput value={q} onChange={setQ} placeholder="Search categories…" />

      {loading ? (
        <p className="py-10 text-center text-sm text-muted">Loading…</p>
      ) : filtered.length === 0 ? (
        <EmptyState icon={faGift} title="No categories found" />
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3"
            >
              <span
                className={`flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl ${COLOR_BG[c.color_key]}`}
              >
                {c.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <FontAwesomeIcon icon={giftIcon(c.icon)} className={`h-5 w-5 ${COLOR_TEXT[c.color_key]}`} />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{c.title}</p>
                <p className="text-xs text-muted">
                  {formatMoney(c.min_amount)} – {formatMoney(c.max_amount)}
                </p>
              </div>
              <RowActions onEdit={() => openEdit(c)} onDelete={() => setDeleting(c)} />
            </div>
          ))}
        </div>
      )}

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? "Edit category" : "Add category"}
        footer={
          <FormFooter
            onCancel={() => setDrawerOpen(false)}
            onSave={save}
            busy={saving}
            saveLabel={editing ? "Save changes" : "Add category"}
          />
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-2 text-xs font-bold text-muted">Image (optional — falls back to icon)</p>
            <div
              className={`relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl ${COLOR_BG[form.color_key]}`}
            >
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imagePreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <FontAwesomeIcon icon={giftIcon(form.icon)} className={`h-7 w-7 ${COLOR_TEXT[form.color_key]}`} />
              )}
              <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-ink/0 text-transparent transition-colors hover:bg-ink/30 hover:text-white">
                <FontAwesomeIcon icon={faImage} className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setImageFile(f);
                    setImagePreview(URL.createObjectURL(f));
                  }}
                />
              </label>
            </div>
          </div>

          <Field label="Title">
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Airtime"
              className="fk-input"
            />
          </Field>

          {!editing && (
            <Field label="ID (slug, auto from title if left blank)">
              <input
                value={form.id}
                onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
                placeholder={slugify(form.title) || "airtime"}
                className="fk-input"
              />
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Icon">
              <select
                value={form.icon}
                onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                className="fk-input"
              >
                {Object.keys(GIFT_ICONS).map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Color">
              <select
                value={form.color_key}
                onChange={(e) => setForm((f) => ({ ...f, color_key: e.target.value as ColorKey }))}
                className="fk-input"
              >
                {COLOR_KEYS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Min amount">
              <input
                type="number"
                value={form.min_amount}
                onChange={(e) => setForm((f) => ({ ...f, min_amount: Number(e.target.value) }))}
                className="fk-input"
              />
            </Field>
            <Field label="Max amount">
              <input
                type="number"
                value={form.max_amount}
                onChange={(e) => setForm((f) => ({ ...f, max_amount: Number(e.target.value) }))}
                className="fk-input"
              />
            </Field>
          </div>

          <Field label="Display order">
            <input
              type="number"
              value={form.order}
              onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))}
              className="fk-input"
            />
          </Field>
        </div>
      </Drawer>

      <ConfirmDialog
        open={!!deleting}
        title={`Delete ${deleting?.title}?`}
        description="This removes the category everywhere — pages featuring it will lose that item. This can't be undone."
        busy={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
