"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { appSettingsRef } from "@/lib/firebase/collections";
import { sounds } from "@/lib/sounds";
import { Field, TabHeader } from "@/components/admin/Shared";
import type { Country, PaymentMethodStatus } from "@/lib/types";

function emptyCountry(): Country {
  return {
    code: "",
    name: "",
    flag: "🏳️",
    city: "",
    currency: "",
    cash_payout_fee: 5,
    status: "coming_soon",
    payment_methods: [
      { id: "mpesa", label: "Mobile Money", status: "coming_soon" },
      { id: "card", label: "Card", status: "coming_soon" },
    ],
  };
}

export function SettingsTab() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getDoc(appSettingsRef).then((snap) => {
      setCountries(snap.exists() ? snap.data().countries ?? [] : []);
      setLoading(false);
    });
  }, []);

  function update(i: number, patch: Partial<Country>) {
    setCountries((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }

  function updatePaymentMethod(i: number, methodId: string, status: PaymentMethodStatus) {
    setCountries((prev) =>
      prev.map((c, idx) =>
        idx === i
          ? { ...c, payment_methods: c.payment_methods.map((m) => (m.id === methodId ? { ...m, status } : m)) }
          : c
      )
    );
  }

  function addCountry() {
    setCountries((prev) => [...prev, emptyCountry()]);
  }

  function removeCountry(i: number) {
    setCountries((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function save() {
    setSaving(true);
    try {
      await setDoc(appSettingsRef, { countries }, { merge: true });
      sounds.success();
      toast.success("Settings saved");
    } catch {
      sounds.error();
      toast.error("Couldn't save settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="py-10 text-center text-sm text-muted">Loading…</p>;

  return (
    <div>
      <TabHeader title="Settings" description="Countries, currencies, fees and payment methods." />

      <div className="flex flex-col gap-4">
        {countries.map((c, i) => (
          <div key={i} className="rounded-2xl border border-border bg-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-display text-sm font-bold">
                {c.flag} {c.name || "New country"}
              </p>
              <button
                onClick={() => removeCountry(i)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-brand-soft hover:text-brand"
              >
                <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label="Flag emoji">
                <input value={c.flag} onChange={(e) => update(i, { flag: e.target.value })} className="fk-input" />
              </Field>
              <Field label="Name">
                <input value={c.name} onChange={(e) => update(i, { name: e.target.value })} className="fk-input" />
              </Field>
              <Field label="Code">
                <input
                  value={c.code}
                  onChange={(e) => update(i, { code: e.target.value.toUpperCase() })}
                  className="fk-input"
                />
              </Field>
              <Field label="City">
                <input value={c.city} onChange={(e) => update(i, { city: e.target.value })} className="fk-input" />
              </Field>
              <Field label="Currency">
                <input
                  value={c.currency}
                  onChange={(e) => update(i, { currency: e.target.value.toUpperCase() })}
                  className="fk-input"
                />
              </Field>
              <Field label="Cash payout fee (%)">
                <input
                  type="number"
                  value={c.cash_payout_fee}
                  onChange={(e) => update(i, { cash_payout_fee: Number(e.target.value) })}
                  className="fk-input"
                />
              </Field>
              <Field label="Status">
                <select
                  value={c.status}
                  onChange={(e) => update(i, { status: e.target.value as PaymentMethodStatus })}
                  className="fk-input"
                >
                  <option value="active">Active</option>
                  <option value="coming_soon">Coming soon</option>
                </select>
              </Field>
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              {c.payment_methods.map((m) => (
                <label key={m.id} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-bold">
                  {m.label}
                  <select
                    value={m.status}
                    onChange={(e) => updatePaymentMethod(i, m.id, e.target.value as PaymentMethodStatus)}
                    className="rounded-lg border border-border bg-bg px-1.5 py-1 text-xs"
                  >
                    <option value="active">Active</option>
                    <option value="coming_soon">Coming soon</option>
                  </select>
                </label>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={addCountry}
          className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-3 text-sm font-bold text-muted hover:bg-surface-2"
        >
          <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5" /> Add country
        </button>

        <button
          onClick={save}
          disabled={saving}
          className="mt-2 self-start rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          Save settings
        </button>
      </div>
    </div>
  );
}
