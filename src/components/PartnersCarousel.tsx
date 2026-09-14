"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStore, faLocationDot } from "@fortawesome/free-solid-svg-icons";
import { usePartners } from "@/lib/data-hooks";

export function PartnersCarousel() {
  const { partners, loading } = usePartners();

  if (loading || partners.length === 0) return null;

  const items = [...partners, ...partners];

  return (
    <section className="mx-auto max-w-5xl px-5 py-14">
      <div className="mb-6 text-center">
        <h2 className="font-display text-2xl font-bold sm:text-3xl">Redeem with our partners</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Gifts can be redeemed in person at any of these businesses.
        </p>
      </div>

      <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
        <div className="animate-marquee flex w-max gap-3">
          {items.map((p, i) => (
            <div
              key={`${p.id}-${i}`}
              className="flex w-60 flex-shrink-0 items-center gap-3 rounded-2xl border border-border bg-bg p-3.5"
            >
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-soft">
                <FontAwesomeIcon icon={faStore} className="h-4 w-4 text-brand" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-bold">{p.name}</span>
                <span className="block truncate text-[11px] text-muted">{p.business_type}</span>
                <span className="mt-0.5 flex items-center gap-1 truncate text-[10.5px] font-semibold text-muted">
                  <FontAwesomeIcon icon={faLocationDot} className="h-2.5 w-2.5" />
                  {p.city}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
