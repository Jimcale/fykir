import type { Metadata } from "next";
import { Fredoka, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "@/lib/fontawesome";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { SettingsProvider } from "@/lib/settings-context";
import { SendFlowProvider } from "@/lib/send-flow-context";
import { ComingSoonGate } from "@/components/ComingSoonGate";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fykir — Send a surprise",
  description:
    "Send friends, followers and strangers a gift surprise in minutes. No app or account needed.",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fredoka.variable} ${jakarta.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-bg font-sans text-ink">
        <AuthProvider>
          <SettingsProvider>
            <SendFlowProvider>
              <ComingSoonGate>{children}</ComingSoonGate>
            </SendFlowProvider>
          </SettingsProvider>
        </AuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              borderRadius: "16px",
              background: "var(--ink)",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 600,
            },
          }}
        />
      </body>
    </html>
  );
}
