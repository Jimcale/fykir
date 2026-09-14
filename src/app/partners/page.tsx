"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { Header } from "@/components/Header";
import { sounds } from "@/lib/sounds";

const BENEFITS = [
  "Reach new customers who arrive ready to redeem a voucher",
  "No POS integration — just honor the code and redemption instructions",
  "Feature your business in the Fykir partner carousel",
];

export default function PartnersPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-14">
        <h1 className="mb-2 font-display text-3xl font-bold">For Partners</h1>
        <p className="mb-8 text-sm leading-relaxed text-muted">
          Join Fykir as a redemption partner and turn gift surprises into foot traffic.
        </p>

        <div className="mb-8 flex flex-col gap-3">
          {BENEFITS.map((b) => (
            <div key={b} className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4">
              <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-soft">
                <FontAwesomeIcon icon={faCheck} className="h-3 w-3 text-green" />
              </span>
              <p className="text-sm">{b}</p>
            </div>
          ))}
        </div>

        <a
          href="https://wa.me/?text=Hi%20Fykir%2C%20I%27d%20like%20to%20become%20a%20redemption%20partner"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => sounds.tap()}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-[15px] font-display font-semibold text-white sm:w-auto sm:px-8"
        >
          <FontAwesomeIcon icon={faWhatsapp} className="h-4 w-4" />
          Chat with our partnerships team
        </a>
      </main>
    </div>
  );
}
