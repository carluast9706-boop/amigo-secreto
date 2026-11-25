"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, AlertCircle } from "lucide-react";

interface CopyButtonProps {
  text: string;
  label: string;
  compact?: boolean;
}

let lastAnnouncement = "";

function legacyCopy(text: string): boolean {
  const previousFocus = document.activeElement as HTMLElement | null;
  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.cssText = "position:fixed;inset-block-start:0;opacity:0";
  document.body.append(field);
  field.select();
  try {
    return document.execCommand("copy");
  } finally {
    field.remove();
    previousFocus?.focus({ preventScroll: true });
  }
}

export function CopyButton({ text, label, compact = false }: CopyButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [liveMessage, setLiveMessage] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function handleCopy() {
    if (!text) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        ok = true;
      } else {
        ok = legacyCopy(text);
      }
    } catch {
      ok = legacyCopy(text);
    }

    let msg = ok ? "Copiado" : "Error al copiar";
    if (msg === lastAnnouncement) {
      msg += "\u00A0";
    }
    lastAnnouncement = msg;

    setStatus(ok ? "copied" : "failed");
    setLiveMessage("");
    requestAnimationFrame(() => setLiveMessage(msg));

    timerRef.current = setTimeout(() => {
      setStatus("idle");
      setLiveMessage("");
    }, 2200);
  }

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleCopy}
        aria-label={label}
        data-copied={status === "copied" ? "" : undefined}
        data-failed={status === "failed" ? "" : undefined}
        className={`inline-flex min-h-9 min-w-9 items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 ${
          status === "copied"
            ? "border-emerald-300 bg-emerald-50 text-emerald-800"
            : status === "failed"
              ? "border-red-300 bg-red-50 text-red-800"
              : "border-stone-300 bg-white text-stone-700 hover:bg-stone-100"
        }`}
      >
        {status === "copied" ? (
          <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
        ) : status === "failed" ? (
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
        ) : (
          <Copy className="h-4 w-4 shrink-0" aria-hidden="true" />
        )}
        {!compact && (
          <span>
            {status === "copied"
              ? "Copiado"
              : status === "failed"
                ? "Error"
                : "Copiar"}
          </span>
        )}
      </button>
      <span
        role="status"
        className={`visually-hidden ${
          status !== "idle" ? "opacity-100" : "opacity-0"
        }`}
      >
        {liveMessage}
      </span>
    </span>
  );
}

