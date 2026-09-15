"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStore } from "@fortawesome/free-solid-svg-icons";
import {
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { db } from "@/lib/firebase/client";
import { giftProductsCol, partnersCol } from "@/lib/firebase/collections";
import { useGiftCategories } from "@/lib/data-hooks";
import { invalidateGiftProductsCache, invalidatePartnersCache } from "@/lib/data-hooks";
import { useSettings } from "@/lib/settings-context";
import { COLOR_BG, COLOR_TEXT, formatMoney } from "@/lib/catalog";
import { giftIcon } from "@/lib/icons";
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
import type { GiftCategory, GiftProduct, Partner } from "@/lib/types";

function slugify(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function emptyForm() {
  return { id: "", name: "", business_type: "", address: "", city: "", country: "KE", whatsapp: "" };
}

export function PartnersTab() {
  const { countries } = useSettings();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Partner | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    const snap = await getDocs(partnersCol);
    setPartners(snap.docs.map((d) => d.data()).sort((a, b) => a.name.localeCompare(b.name)));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return partners;
    return partners.filter((p) => `${p.name} ${p.city} ${p.business_type}`.toLowerCase().includes(term));
  }, [partners, q]);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm());
    setDrawerOpen(true);
  }

  function openEdit(p: Partner) {
    setEditing(p);
    setForm({
      id: p.id,
      name: p.name,
      business_type: p.business_type,
      address: p.address,
      city: p.city,
      country: p.country,
      whatsapp: p.whatsapp,
    });
    setDrawerOpen(true);
  }

  async function save() {
    if (!form.name.trim()) {
      toast.error("Add a business name");
      return;
    }
    const id = editing ? editing.id : slugify(form.id || form.name);
    if (!editing && partners.some((p) => p.id === id)) {
      toast.error("That id is already used");
      return;
    }
    setSaving(true);
    try {
      const data = {
        name: form.name.trim(),
        business_type: form.business_type.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        country: form.country,
        whatsapp: form.whatsapp.trim(),
      };
      if (editing) await updateDoc(doc(db, "partners", id), data);
      else await setDoc(doc(db, "partners", id), data);
      invalidatePartnersCache();
      sounds.success();
      toast.success(editing ? "Partner updated" : "Partner added");
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
      const productsSnap = await getDocs(query(giftProductsCol, where("partner_id", "==", deleting.id)));
      const batch = writeBatch(db);
      productsSnap.docs.forEach((d) => batch.delete(d.ref));
      batch.delete(doc(db, "partners", deleting.id));
      await batch.commit();
      invalidatePartnersCache();
      invalidateGiftProductsCache();
      sounds.success();
      toast.success("Partner deleted");
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
        title="Partners"
        description="Businesses that redeem Fykir vouchers."
        action={<AddButton label="Add Partner" onClick={openAdd} />}
      />
      <AdminSearchInput value={q} onChange={setQ} placeholder="Search partners…" />

      {loading ? (
        <p className="py-10 text-center text-sm text-muted">Loading…</p>
      ) : filtered.length === 0 ? (
        <EmptyState icon={faStore} title="No partners found" />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3.5">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-surface-2 text-muted">
                <FontAwesomeIcon icon={faStore} className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{p.name}</p>
                <p className="truncate text-xs text-muted">
                  {p.business_type} · {p.city}
                </p>
              </div>
              <RowActions onEdit={() => openEdit(p)} onDelete={() => setDeleting(p)} />
            </div>
          ))}
        </div>
      )}

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? "Edit partner" : "Add partner"}
        subtitle={editing?.name}
        footer={
          <FormFooter
            onCancel={() => setDrawerOpen(false)}
            onSave={save}
            busy={saving}
            saveLabel={editing ? "Save changes" : "Add partner"}
          />
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Business name">
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="fk-input"
              placeholder="e.g. Java House"
            />
          </Field>
          {!editing && (
            <Field label="ID (slug, auto from name if left blank)">
              <input
                value={form.id}
                onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
                className="fk-input"
                placeholder={slugify(form.name) || "java-house"}
              />
            </Field>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Business type">
              <input
                value={form.business_type}
                onChange={(e) => setForm((f) => ({ ...f, business_type: e.target.value }))}
                className="fk-input"
                placeholder="Restaurant"
              />
            </Field>
            <Field label="WhatsApp">
              <input
                value={form.whatsapp}
                onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
                className="fk-input"
                placeholder="+2547…"
              />
            </Field>
          </div>
          <Field label="Address">
            <input
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className="fk-input"
              placeholder="Street, mall…"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="City">
              <input
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                className="fk-input"
                placeholder="Nairobi"
              />
            </Field>
            <Field label="Country">
              <select
                value={form.country}
                onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
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

          {editing && (
            <>
              <div className="h-px bg-border" />
              <PartnerProducts partner={editing} />
            </>
          )}
        </div>
      </Drawer>

      <ConfirmDialog
        open={!!deleting}
        title={`Delete ${deleting?.name}?`}
        description="This also removes everything they offer. This can't be undone."
        busy={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

interface ProductForm {
  gift_category_id: string;
  price: number;
  stock: number;
  redeem_instructions: string;
}

function PartnerProducts({ partner }: { partner: Partner }) {
  const { categories } = useGiftCategories();
  const [products, setProducts] = useState<GiftProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null); // "new" or a product id
  const [form, setForm] = useState<ProductForm>({
    gift_category_id: "",
    price: 500,
    stock: 10,
    redeem_instructions: "",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<GiftProduct | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    const snap = await getDocs(query(giftProductsCol, where("partner_id", "==", partner.id)));
    setProducts(snap.docs.map((d) => d.data()));
    setLoading(false);
  }

  useEffect(() => {
    load();
    setEditingId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partner.id]);

  const availableCategories =
    editingId === "new" ? categories.filter((c) => !products.some((p) => p.gift_category_id === c.id)) : categories;

  function startAdd() {
    setEditingId("new");
    setForm({ gift_category_id: availableCategories[0]?.id ?? "", price: 500, stock: 10, redeem_instructions: "" });
  }

  function startEdit(p: GiftProduct) {
    setEditingId(p.id);
    setForm({
      gift_category_id: p.gift_category_id,
      price: p.price,
      stock: p.stock,
      redeem_instructions: p.redeem_instructions,
    });
  }

  async function save() {
    if (!form.gift_category_id) {
      toast.error("Pick a category");
      return;
    }
    setSaving(true);
    try {
      const id = `${form.gift_category_id}__${partner.id}`;
      await setDoc(doc(db, "gift_products", id), {
        gift_category_id: form.gift_category_id,
        partner_id: partner.id,
        price: Number(form.price),
        stock: Number(form.stock),
        redeem_instructions: form.redeem_instructions.trim(),
      });
      invalidateGiftProductsCache(form.gift_category_id);
      sounds.success();
      toast.success("Saved");
      setEditingId(null);
      load();
    } catch {
      sounds.error();
      toast.error("Couldn't save");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteDoc(doc(db, "gift_products", deleting.id));
      invalidateGiftProductsCache(deleting.gift_category_id);
      sounds.success();
      toast.success("Removed");
      setDeleting(null);
      load();
    } catch {
      sounds.error();
      toast.error("Couldn't remove");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold text-muted">What they offer</p>
        {editingId === null && (
          <button onClick={startAdd} className="text-xs font-bold text-brand">
            + Add offering
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-xs text-muted">Loading…</p>
      ) : (
        <div className="flex flex-col gap-2">
          {products.length === 0 && editingId !== "new" && (
            <p className="rounded-xl border border-dashed border-border p-3 text-center text-xs text-muted">
              No offerings yet.
            </p>
          )}
          {products.map((p) => {
            const cat = categories.find((c) => c.id === p.gift_category_id);
            if (editingId === p.id) {
              return (
                <ProductFormRow
                  key={p.id}
                  categories={categories}
                  categoryLocked
                  form={form}
                  setForm={setForm}
                  onCancel={() => setEditingId(null)}
                  onSave={save}
                  saving={saving}
                />
              );
            }
            return (
              <div key={p.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <span
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
                    cat ? COLOR_BG[cat.color_key] : "bg-surface-2"
                  }`}
                >
                  <FontAwesomeIcon
                    icon={giftIcon(cat?.icon ?? "gift")}
                    className={`h-3.5 w-3.5 ${cat ? COLOR_TEXT[cat.color_key] : "text-muted"}`}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold">{cat?.title ?? p.gift_category_id}</p>
                  <p className="text-[11px] text-muted">
                    From {formatMoney(p.price)} · {p.stock} in stock
                  </p>
                </div>
                <RowActions onEdit={() => startEdit(p)} onDelete={() => setDeleting(p)} />
              </div>
            );
          })}
          {editingId === "new" && (
            <ProductFormRow
              categories={availableCategories}
              form={form}
              setForm={setForm}
              onCancel={() => setEditingId(null)}
              onSave={save}
              saving={saving}
            />
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Remove this offering?"
        description="Gifts already redeemed keep their record — this just stops it being offered going forward."
        busy={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

function ProductFormRow({
  categories,
  categoryLocked,
  form,
  setForm,
  onCancel,
  onSave,
  saving,
}: {
  categories: GiftCategory[];
  categoryLocked?: boolean;
  form: ProductForm;
  setForm: (updater: (f: ProductForm) => ProductForm) => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="rounded-xl border border-brand/40 bg-brand-soft/40 p-3">
      <div className="mb-2">
        <select
          disabled={categoryLocked}
          value={form.gift_category_id}
          onChange={(e) => setForm((f) => ({ ...f, gift_category_id: e.target.value }))}
          className="fk-input disabled:opacity-60"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-2 grid grid-cols-2 gap-2">
        <input
          type="number"
          value={form.price}
          onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
          placeholder="Starting price"
          className="fk-input"
        />
        <input
          type="number"
          value={form.stock}
          onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value) }))}
          placeholder="Stock"
          className="fk-input"
        />
      </div>
      <textarea
        value={form.redeem_instructions}
        onChange={(e) => setForm((f) => ({ ...f, redeem_instructions: e.target.value }))}
        placeholder="Redeem instructions"
        rows={2}
        className="fk-input mb-2 resize-none"
      />
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 rounded-lg border border-border py-2 text-xs font-bold">
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="flex-1 rounded-lg bg-brand py-2 text-xs font-bold text-white disabled:opacity-60"
        >
          Save
        </button>
      </div>
    </div>
  );
}
