"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { login } from "@/lib/actions/auth";
import { Field, inputClass } from "@/components/ui/form";
import { PasswordField } from "@/components/ui/password-field";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <div>
      <form action={formAction} className="flex flex-col gap-5">
        <Field label="Email">
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className={inputClass}
          />
        </Field>

        <PasswordField
          name="password"
          label="Password"
          autoComplete="current-password"
        />

        {state?.error && (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
          >
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition-colors hover:bg-blue-700 active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {pending ? "Logging in…" : "Log In"}
        </button>
      </form>

      <p className="mt-7 border-t border-slate-100 pt-6 text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-blue-600 hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
