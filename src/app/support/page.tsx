"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { Header } from "@/components/Header";
import { sounds } from "@/lib/sounds";

export default function SupportPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-14">
        <h1 className="mb-2 font-display text-3xl font-bold">Contact Support</h1>
        <p className="mb-8 text-sm leading-relaxed text-muted">
          Something not working, or a gift stuck mid-redemption? We&apos;re here to help.
        </p>

        <div className="flex flex-col gap-3">
          <a
            href="https://wa.me/?text=Hi%20Fykir%20support%2C%20I%20need%20help%20with..."
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => sounds.tap()}
            className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 hover:bg-surface-2"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-soft">
              <FontAwesomeIcon icon={faWhatsapp} className="h-4 w-4 text-green" />
            </span>
            <span>
              <span className="block text-sm font-bold">WhatsApp us</span>
              <span className="block text-xs text-muted">Fastest way to reach us</span>
            </span>
          </a>

          <a
            href="mailto:support@fykir.com"
            onClick={() => sounds.tap()}
            className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 hover:bg-surface-2"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft">
              <FontAwesomeIcon icon={faEnvelope} className="h-4 w-4 text-brand" />
            </span>
            <span>
              <span className="block text-sm font-bold">Email us</span>
              <span className="block text-xs text-muted">support@fykir.com</span>
            </span>
          </a>
        </div>
      </main>
    </div>
  );
}
