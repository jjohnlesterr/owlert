"use client";

import { useActionState } from "react";
import { addSource } from "@/lib/actions/sources";
import { inputClass } from "@/components/ui/form";

export function AddSourceForm() {
  const [state, formAction, pending] = useActionState(addSource, undefined);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,27,51,0.04)] sm:p-5"
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
          className="shrink-0 rounded-lg bg-navy px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy-light disabled:cursor-not-allowed disabled:opacity-60"
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
