"use client";

import { Trash2 } from "lucide-react";
import { useActionState, useRef, useState } from "react";
import { removeSource, type RemoveSourceState } from "@/lib/actions/sources";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function RemoveSourceButton({
  sourceId,
  sourceName,
}: {
  sourceId: string;
  sourceName: string;
}) {
  const [state, formAction, pending] = useActionState(removeSource, undefined);
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Close the dialog once the delete actually succeeds — an error keeps it
  // open (with the error shown) so the user can retry or cancel. Adjusting
  // state during render (rather than in an effect) per React's guidance:
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [lastHandledState, setLastHandledState] = useState<
    RemoveSourceState | undefined
  >(state);
  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (state?.success && open) {
      setOpen(false);
    }
  }

  return (
    <div>
      {/* Not visually rendered — just carries the source_id to the Server
          Action; the dialog's confirm button submits it via ref. */}
      <form ref={formRef} action={formAction}>
        <input type="hidden" name="source_id" value={sourceId} />
      </form>

      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Remove source"
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Remove
      </button>

      <ConfirmDialog
        open={open}
        title="Remove source?"
        description={
          <>
            Are you sure you want to remove{" "}
            <span className="font-medium text-navy">
              &ldquo;{sourceName}&rdquo;
            </span>
            ? BeeAlert will stop monitoring it, and saved detections from this
            source will also be removed.
          </>
        }
        confirmLabel="Remove Source"
        pendingLabel="Removing…"
        pending={pending}
        error={state?.error}
        onCancel={() => setOpen(false)}
        onConfirm={() => formRef.current?.requestSubmit()}
      />
    </div>
  );
}
