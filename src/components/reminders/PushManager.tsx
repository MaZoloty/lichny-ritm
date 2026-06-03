"use client";

import { useEffect, useState } from "react";
import {
  removePushSubscription,
  savePushSubscription,
} from "../../../app/(app)/settings/reminders/actions";

type PushState =
  | "checking"
  | "unsupported"
  | "default"
  | "denied"
  | "granted"
  | "subscribed";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64: string): BufferSource {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(normalized);
  const buffer = new ArrayBuffer(raw.length);
  const out = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function isSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export default function PushManager() {
  const [state, setState] = useState<PushState>("checking");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupported()) {
      setState("unsupported");
      return;
    }
    const permission = Notification.permission;
    if (permission === "denied") {
      setState("denied");
      return;
    }
    if (permission === "default") {
      setState("default");
      return;
    }
    // granted — проверим, есть ли уже подписка.
    navigator.serviceWorker
      .getRegistration()
      .then((reg) => reg?.pushManager.getSubscription())
      .then((sub) => setState(sub ? "subscribed" : "granted"))
      .catch(() => setState("granted"));
  }, []);

  async function enable() {
    setBusy(true);
    setNote(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "default");
        return;
      }

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      if (!VAPID_PUBLIC_KEY) {
        // Без публичного VAPID-ключа реальную подписку создать нельзя.
        // Разрешение получено — остальное подключится, когда задан ключ.
        setState("granted");
        setNote(
          "Разрешение получено. Доставку push можно включить позже, когда настроены ключи на сервере.",
        );
        return;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const json = sub.toJSON();
      const res = await savePushSubscription({
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
        userAgent: navigator.userAgent,
      });
      if (res.error) {
        setNote(res.error);
        setState("granted");
        return;
      }
      setState("subscribed");
    } catch {
      setNote("Не удалось включить уведомления в этом браузере.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setNote(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await removePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setState("granted");
    } catch {
      setNote("Не удалось отключить уведомления.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <StatusLine state={state} />

      {state === "unsupported" && (
        <p className="mt-1 text-sm text-muted">
          Браузер не поддерживает push-уведомления.
        </p>
      )}

      {(state === "default" || state === "granted") && (
        <button
          type="button"
          onClick={enable}
          disabled={busy}
          className="btn-primary mt-3 w-full"
        >
          Разрешить уведомления
        </button>
      )}

      {state === "subscribed" && (
        <button
          type="button"
          onClick={disable}
          disabled={busy}
          className="btn-ghost mt-3 w-full"
        >
          Отключить уведомления
        </button>
      )}

      {state === "denied" && (
        <p className="mt-1 text-sm text-muted">
          Уведомления запрещены в настройках браузера. Их можно снова разрешить
          в настройках сайта.
        </p>
      )}

      {note && <p className="mt-3 text-sm text-muted">{note}</p>}
    </div>
  );
}

function StatusLine({ state }: { state: PushState }) {
  const label =
    state === "checking"
      ? "Проверяем…"
      : state === "unsupported"
        ? "Браузер не поддерживает push-уведомления"
        : state === "subscribed"
          ? "Уведомления включены"
          : state === "denied"
            ? "Уведомления запрещены"
            : "Не настроено";
  const tone =
    state === "subscribed"
      ? "text-accent"
      : state === "denied"
        ? "text-peach"
        : "text-muted";
  return <p className={`text-sm font-medium ${tone}`}>{label}</p>;
}
