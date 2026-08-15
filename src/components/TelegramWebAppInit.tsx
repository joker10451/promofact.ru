"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        HapticFeedback?: {
          impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
          notificationOccurred: (type: "error" | "success" | "warning") => void;
        };
      };
    };
  }
}

export default function TelegramWebAppInit() {
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        if (tg.ready) tg.ready();
        if (tg.expand) tg.expand();
        if (tg.setHeaderColor) tg.setHeaderColor("#0b102b");
        if (tg.setBackgroundColor) tg.setBackgroundColor("#f2f4fa");
      }
    } catch (e) {
      console.warn("Telegram WebApp init error", e);
    }
  }, []);

  return null;
}
