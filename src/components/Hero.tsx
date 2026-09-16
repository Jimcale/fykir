"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faArrowRight, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useSendFlow } from "@/lib/send-flow-context";
import { COLOR_BG, COLOR_TEXT } from "@/lib/catalog";
import { giftIcon } from "@/lib/icons";
import { sounds } from "@/lib/sounds";
import type { ColorKey } from "@/lib/types";

interface DecorIcon {
  icon: IconDefinition;
  color: ColorKey;
  className: string;
  delay?: string;
}

const DECOR_ICONS: DecorIcon[] = [
  { icon: giftIcon("mobile-screen"), color: "teal", className: "flex top-10 left-[7%] h-10 w-10" },
  { icon: giftIcon("utensils"), color: "pink", className: "flex bottom-14 left-[9%] h-10 w-10", delay: "0.8s" },
  { icon: giftIcon("cake-candles"), color: "brand", className: "hidden sm:flex top-14 right-[9%] h-11 w-11", delay: "0.4s" },
  { icon: giftIcon("seedling"), color: "green", className: "hidden sm:flex bottom-10 right-[7%] h-10 w-10", delay: "1.2s" },
  { icon: giftIcon("cookie"), color: "orange", className: "hidden md:flex top-40 left-[22%] h-9 w-9", delay: "0.6s" },
  { icon: giftIcon("clapperboard"), color: "violet", className: "hidden md:flex bottom-32 right-[22%] h-9 w-9", delay: "1.6s" },
  { icon: giftIcon("spa"), color: "yellow", className: "hidden lg:flex top-24 right-[27%] h-9 w-9", delay: "0.3s" },
];

export function Hero() {
  const { open } = useSendFlow();
  const { page } = useAuth();

  return (
    <section className="relative overflow-hidden px-5 pb-16 pt-16 text-center sm:pb-24 sm:pt-24">
      <div className="animate-float-blob pointer-events-none absolute -top-16 left-[8%] h-40 w-40 rounded-full bg-brand-soft blur-2xl" />
      <div className="animate-float-blob pointer-events-none absolute -top-8 right-[10%] h-32 w-32 rounded-full bg-yellow-soft blur-2xl [animation-delay:1s]" />
      <div className="animate-float-blob pointer-events-none absolute bottom-0 left-[32%] h-36 w-36 rounded-full bg-violet-soft blur-2xl [animation-delay:1.6s]" />

      {DECOR_ICONS.map((d, i) => (
        <span
          key={i}
          className={`animate-bob pointer-events-none absolute items-center justify-center rounded-2xl shadow-sm ${COLOR_BG[d.color]} ${d.className}`}
          style={d.delay ? { animationDelay: d.delay } : undefined}
        >
          <FontAwesomeIcon icon={d.icon} className={`h-1/2 w-1/2 ${COLOR_TEXT[d.color]}`} />
        </span>
      ))}

      <div className="relative z-10 mx-auto max-w-2xl">
        <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Send And Receive Gift Surprises
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-base text-muted sm:text-lg">
          Create your gifting page to let friends, family and followers send you surprises in minutes —
          No app or account needed.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            onClick={() => {
              sounds.pop();
              open();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3.5 font-display font-semibold text-white shadow-[0_10px_24px_-8px_var(--brand)] transition-transform active:scale-95 sm:w-auto"
          >
            <FontAwesomeIcon icon={faPaperPlane} className="h-4 w-4" />
            Send Surprise
          </button>
          <Link
            href={page ? `/p/${page.username}` : "/create"}
            onClick={() => sounds.tap()}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-surface px-6 py-3.5 font-display font-semibold transition-transform active:scale-95 sm:w-auto"
          >
            {page ? "Go To Your Page" : "Create Your Page"}
            <FontAwesomeIcon icon={faArrowRight} className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
