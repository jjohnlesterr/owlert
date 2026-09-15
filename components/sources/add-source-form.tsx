"use client";

import { useActionState } from "react";
import { addSource } from "@/lib/actions/sources";
import { inputClass } from "@/components/ui/form";

export function AddSourceForm() {
  const [state, formAction, pending] = useActionState(addSource, undefined);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-200/50 sm:p-5"
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="url"
          name="url"
          required
          placeholder="https://example.com/weather-news"
          className={`${inputClass} flex-1`}
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Checking…" : "Add Source"}
        </button>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && (
        <p className="text-sm text-green-700">{state.message}</p>
      )}
    </form>
  );
}
