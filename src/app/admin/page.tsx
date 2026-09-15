"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleNotch, faLock } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { AdminShell, type AdminTabId } from "@/components/admin/AdminShell";
import { DashboardTab } from "@/components/admin/tabs/DashboardTab";
import { CategoriesTab } from "@/components/admin/tabs/CategoriesTab";
import { PartnersTab } from "@/components/admin/tabs/PartnersTab";
import { UsersTab } from "@/components/admin/tabs/UsersTab";
import { PagesTab } from "@/components/admin/tabs/PagesTab";
import { GiftsTab } from "@/components/admin/tabs/GiftsTab";
import { SettingsTab } from "@/components/admin/tabs/SettingsTab";

export default function AdminPage() {
  const { user, loading, roleLoading, isStaff } = useAuth();
  const [tab, setTab] = useState<AdminTabId>("dashboard");

  if (loading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <FontAwesomeIcon icon={faCircleNotch} className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  if (!user || user.isAnonymous || !isStaff) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-5 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand">
          <FontAwesomeIcon icon={faLock} className="h-5 w-5" />
        </span>
        <p className="font-display text-xl font-bold">Staff access only</p>
        <p className="max-w-xs text-sm text-muted">
          This area is for the Fykir team. Sign in with an account that has staff or admin access.
        </p>
        <Link href="/" className="mt-2 text-xs font-bold text-brand">
          Back to Fykir
        </Link>
      </div>
    );
  }

  return (
    <AdminShell active={tab} onChange={setTab}>
      {tab === "dashboard" && <DashboardTab />}
      {tab === "categories" && <CategoriesTab />}
      {tab === "partners" && <PartnersTab />}
      {tab === "users" && <UsersTab />}
      {tab === "pages" && <PagesTab />}
      {tab === "gifts" && <GiftsTab />}
      {tab === "settings" && <SettingsTab />}
    </AdminShell>
  );
}
