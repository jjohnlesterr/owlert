"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** Shown on the confirm button while an action is in flight. */
  pendingLabel?: string;
  pending?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Generic, reusable confirmation modal — not specific to source removal.
 * Renders via a portal to document.body so it's never clipped by an
 * ancestor's overflow/stacking context. No dialog library: this is the
 * whole implementation.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  pendingLabel = "Please wait…",
  pending = false,
  error,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    cancelButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) onCancel();
    };
    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, pending, onCancel]);

  // No SSR-safe "mounted" gate needed: `open` can only ever become true in
  // response to a prior client-side interaction (e.g. clicking a trigger
  // button), by which point the component has already mounted and
  // `document` is guaranteed to exist.
  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget && !pending) onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2
              id="confirm-dialog-title"
              className="text-lg font-semibold text-navy"
            >
              {title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? pendingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
