"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleNotch,
  faMagnifyingGlass,
  faPenToSquare,
  faPlus,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import type { ReactNode } from "react";

export function TabHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-display text-xl font-bold sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function AdminSearchInput({
  value,
  onChange,
  placeholder = "Search…",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="mb-4 flex flex-1 items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2.5 sm:max-w-xs">
      <FontAwesomeIcon icon={faMagnifyingGlass} className="h-3.5 w-3.5 text-muted" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
      />
    </div>
  );
}

export function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-2 rounded-full bg-brand px-4 py-2.5 font-display text-sm font-semibold text-white shadow-[0_6px_16px_-6px_var(--brand)] transition-transform active:scale-95"
    >
      <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
      {label}
    </button>
  );
}

export function RowActions({
  onEdit,
  onDelete,
}: {
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="flex flex-shrink-0 items-center justify-end gap-1.5">
      {onEdit && (
        <button
          onClick={onEdit}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
          aria-label="Edit"
        >
          <FontAwesomeIcon icon={faPenToSquare} className="h-3.5 w-3.5" />
        </button>
      )}
      {onDelete && (
        <button
          onClick={onDelete}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-brand-soft hover:text-brand"
          aria-label="Delete"
        >
          <FontAwesomeIcon icon={faTrash} className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: IconDefinition;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-14 text-center">
      <FontAwesomeIcon icon={icon} className="h-6 w-6 text-muted" />
      <p className="text-sm font-bold">{title}</p>
      {subtitle && <p className="max-w-xs text-xs text-muted">{subtitle}</p>}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold text-muted">{label}</label>
      {children}
    </div>
  );
}

export function FormFooter({
  onCancel,
  onSave,
  saveLabel = "Save",
  busy,
  disabled,
}: {
  onCancel: () => void;
  onSave: () => void;
  saveLabel?: string;
  busy?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-2.5">
      <button
        onClick={onCancel}
        className="flex-1 rounded-xl border border-border py-2.5 text-sm font-bold"
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={busy || disabled}
        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-bold text-white disabled:opacity-60"
      >
        {busy && <FontAwesomeIcon icon={faCircleNotch} className="h-3.5 w-3.5 animate-spin" />}
        {saveLabel}
      </button>
    </div>
  );
}
