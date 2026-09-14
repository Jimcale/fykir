"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { sounds } from "@/lib/sounds";

export function CreatePageCTA() {
  const { page } = useAuth();

  const href = page ? `/p/${page.username}` : "/create";
  const label = page ? "View Your Page" : "Create Your Page";
  const heading = page ? "Share your page to get more surprises" : "Ready to receive surprises?";
  const body = page
    ? "Post your Fykir link in your bio, story or WhatsApp status so friends, followers and family keep sending you gifts."
    : "Create your free Fykir page so friends, followers and family can easily send you a gift — no app or account needed on their end.";

  return (
    <section className="mx-auto max-w-5xl px-5 py-14">
      <div className="relative overflow-hidden rounded-[28px] bg-ink px-6 py-12 text-center text-white sm:py-16">
        <div className="animate-float-blob pointer-events-none absolute -top-10 left-[10%] h-40 w-40 rounded-full bg-brand/30 blur-3xl" />
        <div className="animate-float-blob pointer-events-none absolute bottom-0 right-[8%] h-44 w-44 rounded-full bg-violet/30 blur-3xl [animation-delay:1s]" />

        <div className="relative z-10 flex flex-col items-center">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-2xl">
            🎁
          </span>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">{heading}</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/70">{body}</p>
          <Link
            href={href}
            onClick={() => sounds.tap()}
            className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3.5 font-display font-semibold text-white shadow-[0_10px_24px_-8px_var(--brand)] transition-transform active:scale-95"
          >
            {label}
            <FontAwesomeIcon icon={faArrowRight} className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
