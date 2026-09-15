"use client";

import { useActionState } from "react";
import { checkSourceNow } from "@/lib/actions/sources";

export function CheckNowButton({ sourceId }: { sourceId: string }) {
  const [state, formAction, pending] = useActionState(
    checkSourceNow,
    undefined,
  );

  return (
    <div>
      <form action={formAction}>
        <input type="hidden" name="source_id" value={sourceId} />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-60"
        >
          {pending ? "Checking…" : "Check Now"}
        </button>
      </form>

      {state?.error && (
        <p className="mt-1.5 text-xs text-red-600">{state.error}</p>
      )}
      {state?.message && (
        <p
          className={`mt-1.5 text-xs ${
            state.foundNew ? "font-medium text-green-700" : "text-slate-500"
          }`}
        >
          {state.message}
        </p>
      )}
    </div>
  );
}
