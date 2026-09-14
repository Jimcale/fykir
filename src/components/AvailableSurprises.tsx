"use client";

import toast from "react-hot-toast";
import { arrayUnion, updateDoc } from "firebase/firestore";
import { useGiftCategories } from "@/lib/data-hooks";
import { GiftCard } from "@/components/GiftCard";
import { useAuth } from "@/lib/auth-context";
import { useSendFlow } from "@/lib/send-flow-context";
import { useSettings } from "@/lib/settings-context";
import { pageRef } from "@/lib/firebase/collections";
import { sounds } from "@/lib/sounds";
import type { GiftCategory } from "@/lib/types";

export function AvailableSurprises() {
  const { categories, loading } = useGiftCategories();
  const { page } = useAuth();
  const { open } = useSendFlow();
  const { country } = useSettings();

  async function addToPage(category: GiftCategory) {
    if (!page) {
      toast.error("Create your page first");
      sounds.error();
      return;
    }
    if (page.featured.some((f) => f.category_id === category.id)) return;
    await updateDoc(pageRef(page.username), {
      featured: arrayUnion({ category_id: category.id, min_amount: category.min_amount }),
    });
    sounds.pop();
    toast.success(`${category.title} added to your page`);
  }

  return (
    <section className="mx-auto max-w-5xl px-5 py-14">
      <div className="mb-6 text-center">
        <h2 className="font-display text-2xl font-bold sm:text-3xl">Available Surprises</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Send one straight to a friend, or add it to your own page so people know what
          you&apos;d love.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-[18px] border border-border bg-surface">
              <div className="h-24 animate-pulse bg-surface-2" />
              <div className="flex flex-col gap-2 p-3">
                <div className="h-3 w-3/4 animate-pulse rounded bg-surface-2" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-surface-2" />
                <div className="h-8 animate-pulse rounded-full bg-surface-2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {categories.map((c) => (
            <GiftCard
              key={c.id}
              category={c}
              currency={country.currency}
              onSend={() => open({ category: c })}
              showAddToPage
              added={page?.featured.some((f) => f.category_id === c.id)}
              onAddToPage={() => addToPage(c)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
