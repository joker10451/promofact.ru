"use client";

import { useEffect, useState } from "react";
import { ymReachGoal } from "@/components/YandexMetrika";

export default function PushNotificationPrompt() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isVisible, setIsVisible] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const supported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;

    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);

      // Регистрируем service worker
      navigator.serviceWorker.register("/sw.js").catch(() => {});

      // Показываем предложение подписаться, если статус default и не закрывали недавно
      if (Notification.permission === "default") {
        try {
          const dismissedAt = localStorage.getItem("push_prompt_dismissed");
          if (!dismissedAt || Date.now() - Number(dismissedAt) > 3 * 24 * 60 * 60 * 1000) {
            const timer = setTimeout(() => setIsVisible(true), 4000);
            return () => clearTimeout(timer);
          }
        } catch {}
      }
    }
  }, []);

  const handleSubscribe = async () => {
    if (!isSupported) return;
    setIsSubscribing(true);

    try {
      const res = await Notification.requestPermission();
      setPermission(res);

      if (res === "granted") {
        ymReachGoal("push_subscribed");
        setIsVisible(false);

        // Получаем push subscription
        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          // Если настроен VAPID ключ, можно передавать applicationServerKey
          const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
          const options: PushSubscriptionOptionsInit = {
            userVisibleOnly: true,
          };
          if (vapidKey) {
            options.applicationServerKey = vapidKey;
          }
          subscription = await registration.pushManager.subscribe(options).catch(() => null);
        }

        // Локальное тестовое приветственное уведомление
        if (registration.showNotification) {
          registration.showNotification("🎉 Вы подписаны на скидки!", {
            body: "Мы пришлем вам уведомление, как только появится эксклюзивный промокод.",
            icon: "/icon.svg",
            badge: "/icon.svg",
          });
        }
      } else {
        setIsVisible(false);
      }
    } catch {
      setIsVisible(false);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      localStorage.setItem("push_prompt_dismissed", String(Date.now()));
    } catch {}
  };

  if (!isSupported || !isVisible || permission !== "default") {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-label="Подписка на уведомления"
      className="fixed bottom-5 left-4 z-50 max-w-sm rounded-2xl border-2 border-ink bg-white p-4 shadow-[0_8px_0_rgba(11,16,43,0.18)] transition-all animate-bounce-short sm:left-6"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow text-xl">
          🔔
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-sm font-extrabold text-ink">
            Узнавайте о скидках первыми
          </div>
          <p className="mt-1 text-xs text-ink/65 leading-relaxed">
            Присылаем только жирные промокоды и закрытые акции (не чаще 1 раза в день).
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleSubscribe}
              disabled={isSubscribing}
              className="rounded-xl bg-ink px-3.5 py-1.5 text-xs font-bold text-white shadow-offset-red hover:translate-y-[1px] hover:shadow-none transition-all disabled:opacity-50"
            >
              {isSubscribing ? "Подключение..." : "Включить уведомления"}
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-xl px-2.5 py-1.5 text-xs font-bold text-ink/50 hover:text-ink transition-colors"
            >
              Позже
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-ink/40 hover:text-ink text-sm font-bold leading-none"
          aria-label="Закрыть"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
