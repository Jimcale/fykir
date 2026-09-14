"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCommentSms, faCopy, faLink, faXmark } from "@fortawesome/free-solid-svg-icons";
import {
  faFacebookMessenger,
  faInstagram,
  faSnapchat,
  faTelegram,
  faWhatsapp,
} from "@fortawesome/free-brands-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { useState } from "react";
import toast from "react-hot-toast";
import { Sheet } from "@/components/ui/Sheet";
import { sounds } from "@/lib/sounds";

interface ShareTarget {
  id: string;
  label: string;
  icon: IconDefinition;
  bg: string;
  color: string;
  getShareUrl: (url: string, text: string) => string;
  copyFirst?: boolean;
}

const SHARE_TARGETS: ShareTarget[] = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: faWhatsapp,
    bg: "#25D366",
    color: "#fff",
    getShareUrl: (url, text) => `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
  },
  {
    id: "telegram",
    label: "Telegram",
    icon: faTelegram,
    bg: "#26A5E4",
    color: "#fff",
    getShareUrl: (url, text) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  {
    id: "messenger",
    label: "Messenger",
    icon: faFacebookMessenger,
    bg: "#00B2FF",
    color: "#fff",
    getShareUrl: (url) => `fb-messenger://share/?link=${encodeURIComponent(url)}`,
    copyFirst: true,
  },
  {
    id: "instagram",
    label: "Instagram",
    icon: faInstagram,
    bg: "linear-gradient(135deg,#f58529,#dd2a7b,#8134af,#515bd4)",
    color: "#fff",
    getShareUrl: () => "https://www.instagram.com/",
    copyFirst: true,
  },
  {
    id: "snapchat",
    label: "Snapchat",
    icon: faSnapchat,
    bg: "#FFFC00",
    color: "#111",
    getShareUrl: (url) => `https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(url)}`,
    copyFirst: true,
  },
  {
    id: "sms",
    label: "Messages",
    icon: faCommentSms,
    bg: "#34C759",
    color: "#fff",
    getShareUrl: (url, text) => `sms:?body=${encodeURIComponent(`${text} ${url}`)}`,
  },
];

export function SharePopup({
  open,
  onClose,
  url,
  text,
}: {
  open: boolean;
  onClose: () => void;
  url: string;
  text: string;
}) {
  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      sounds.pop();
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function share(target: ShareTarget) {
    sounds.tap();
    if (target.copyFirst) {
      navigator.clipboard.writeText(url).catch(() => {});
      toast.success(`Link copied — paste it in ${target.label}`);
    }
    window.open(target.getShareUrl(url, text), "_blank");
  }

  return (
    <Sheet open={open} onClose={onClose} maxWidth="max-w-sm">
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Share your page</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 hover:bg-border/60"
          >
            <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-dashed border-border p-3">
          <FontAwesomeIcon icon={faLink} className="h-3.5 w-3.5 flex-shrink-0 text-muted" />
          <span className="min-w-0 flex-1 truncate text-left text-xs text-muted">{url}</span>
          <button
            onClick={copyLink}
            className="flex flex-shrink-0 items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-xs font-bold"
          >
            <FontAwesomeIcon icon={faCopy} className="h-3 w-3" />
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {SHARE_TARGETS.map((target) => (
            <button
              key={target.id}
              onClick={() => share(target)}
              className="flex flex-col items-center gap-1.5"
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full transition-transform active:scale-90"
                style={{ background: target.bg, color: target.color }}
              >
                <FontAwesomeIcon icon={target.icon} className="h-5 w-5" />
              </span>
              <span className="text-[11px] font-semibold">{target.label}</span>
            </button>
          ))}
        </div>
      </div>
    </Sheet>
  );
}
