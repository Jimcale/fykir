"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { useSendFlow } from "@/lib/send-flow-context";
import { sounds } from "@/lib/sounds";

export function Hero() {
  const { open } = useSendFlow();

  return (
    <section className="relative overflow-hidden px-5 pb-16 pt-16 text-center sm:pb-24 sm:pt-24">
      <div className="animate-float-blob pointer-events-none absolute -top-16 left-[8%] h-40 w-40 rounded-full bg-brand-soft blur-2xl" />
      <div className="animate-float-blob pointer-events-none absolute -top-8 right-[10%] h-32 w-32 rounded-full bg-yellow-soft blur-2xl [animation-delay:1s]" />
      <div className="animate-bob pointer-events-none absolute top-24 left-[20%] hidden h-9 w-9 items-center justify-center rounded-full bg-violet-soft sm:flex">
        🎁
      </div>

      <div className="relative z-10 mx-auto max-w-2xl">
        <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Send And Receive Surprises
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-base text-muted sm:text-lg">
          Create your gifting page to let friends, family, followers send you surprises in minutes —
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
            href="/create"
            onClick={() => sounds.tap()}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-surface px-6 py-3.5 font-display font-semibold transition-transform active:scale-95 sm:w-auto"
          >
            Create Your Page
            <FontAwesomeIcon icon={faArrowRight} className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
