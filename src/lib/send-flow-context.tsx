"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { GiftCategory, Page } from "@/lib/types";
import { SendGiftModal } from "@/components/SendGiftModal";

export interface SendFlowOpenOptions {
  category?: GiftCategory;
  recipient?: Page;
}

interface SendFlowContextValue {
  open: (opts?: SendFlowOpenOptions) => void;
}

const SendFlowContext = createContext<SendFlowContextValue>({
  open: () => {},
});

export function SendFlowProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<SendFlowOpenOptions | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  function open(opts?: SendFlowOpenOptions) {
    setOptions(opts ?? {});
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
  }

  return (
    <SendFlowContext.Provider value={{ open }}>
      {children}
      <SendGiftModal
        open={isOpen}
        onClose={close}
        initialCategory={options?.category ?? null}
        initialRecipient={options?.recipient ?? null}
      />
    </SendFlowContext.Provider>
  );
}

export function useSendFlow() {
  return useContext(SendFlowContext);
}
