"use client";

import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faGift,
  faLink,
  faMoneyBillWave,
  faUserPlus,
} from "@fortawesome/free-solid-svg-icons";
import { Header } from "@/components/Header";

const STEPS = [
  {
    icon: faUserPlus,
    title: "Create your page",
    body: "Set up a free Fykir page in minutes — pick a username, add a photo and feature a few surprises you'd love to receive.",
  },
  {
    icon: faLink,
    title: "Share your link",
    body: "Post it in your bio, story or WhatsApp status. Anyone can send you a gift — no app or account needed on their end.",
  },
  {
    icon: faGift,
    title: "Get surprised",
    body: "Friends, followers or even strangers send a voucher your way. You'll get a private link when one arrives.",
  },
  {
    icon: faMoneyBillWave,
    title: "Unwrap & redeem",
    body: "Open the link, watch the countdown unlock your surprise, then redeem it at a partner business or convert it to M-Pesa cash.",
  },
];

const FAQS = [
  {
    q: "Do I need to create an account to send a gift?",
    a: "No. Open the site and start sending — you're automatically signed in behind the scenes, no signup form required.",
  },
  {
    q: "Can I send a gift to someone who doesn't have a Fykir page yet?",
    a: "Yes. Choose \"They don't have a page yet\" in the send flow, add their name and WhatsApp number, and we'll invite them to set one up so they can receive your surprise.",
  },
  {
    q: "Can I send anonymously?",
    a: "Yes — toggle \"Send anonymously\" and pick a fun alias. The recipient will see your alias instead of your name.",
  },
  {
    q: "How does my recipient redeem their gift?",
    a: "They open their reveal link, unwrap the countdown, then choose to redeem the voucher in person at a partner business or convert it to M-Pesa cash (a small processing fee applies to cash payouts).",
  },
  {
    q: "What happens if I lose access to my browser?",
    a: "Your page is tied to this browser by default. Open the account menu and choose \"Protect Your Page\" to link a Google account so you can sign in from anywhere and never lose access.",
  },
  {
    q: "Which countries does Fykir support?",
    a: "Fykir is currently live in Kenya, with more countries coming soon.",
  },
];

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-14">
        <h1 className="mb-4 font-display text-3xl font-bold">About Fykir</h1>
        <p className="mb-4 text-sm leading-relaxed text-muted">
          Fykir makes it fun and effortless to send a surprise to someone you care about —
          airtime, a birthday cake, flowers, a spa day and more — redeemable at real partner
          businesses or converted to M-Pesa cash.
        </p>
        <p className="mb-4 text-sm leading-relaxed text-muted">
          No app to install and no account required to send. Create a free page in minutes to
          let friends, followers and even strangers surprise you back.
        </p>
        <p className="text-sm leading-relaxed text-muted">
          Fykir is currently live in Kenya, with Uganda and Somalia coming soon.
        </p>

        <div className="mt-14">
          <h2 className="font-display text-2xl font-bold">How it works</h2>
          <div className="mt-6 flex flex-col gap-4">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="flex gap-4 rounded-2xl border border-border bg-surface p-4"
              >
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <FontAwesomeIcon icon={step.icon} className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-bold text-brand">Step {i + 1}</p>
                  <p className="mt-0.5 text-sm font-bold">{step.title}</p>
                  <p className="mt-1 text-sm text-muted">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14">
          <h2 className="font-display text-2xl font-bold">Frequently asked questions</h2>
          <div className="mt-6 flex flex-col gap-2">
            {FAQS.map((item) => (
              <Disclosure key={item.q} as="div" className="rounded-2xl border border-border bg-surface">
                {({ open }) => (
                  <>
                    <DisclosureButton className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-bold">
                      <span>{item.q}</span>
                      <FontAwesomeIcon
                        icon={faChevronDown}
                        className={`h-3 w-3 flex-shrink-0 text-muted transition-transform ${
                          open ? "rotate-180" : ""
                        }`}
                      />
                    </DisclosureButton>
                    <DisclosurePanel className="px-4 pb-4 text-sm text-muted">{item.a}</DisclosurePanel>
                  </>
                )}
              </Disclosure>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
