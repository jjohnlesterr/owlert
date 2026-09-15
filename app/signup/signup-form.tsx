"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { signup } from "@/lib/actions/auth";
import { Field, inputClass } from "@/components/ui/form";
import { PasswordField } from "@/components/ui/password-field";

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signup, undefined);

  if (state?.message) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-6 text-center">
        <CheckCircle2 className="h-8 w-8 text-green-600" />
        <p className="text-sm text-green-800">{state.message}</p>
        <Link
          href="/login"
          className="mt-1 text-sm font-medium text-blue-600 hover:underline"
        >
          Go to Log In
        </Link>
      </div>
    );
  }

  return (
    <div>
      <form action={formAction} className="flex flex-col gap-5">
        <Field label="Full name">
          <input
            name="full_name"
            required
            autoComplete="name"
            placeholder="Juan Dela Cruz"
            className={inputClass}
          />
        </Field>

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
          autoComplete="new-password"
          minLength={8}
        />

        <PasswordField
          name="confirm_password"
          label="Confirm password"
          autoComplete="new-password"
          minLength={8}
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
          {pending ? "Creating account…" : "Sign Up"}
        </button>
      </form>

      <p className="mt-7 border-t border-slate-100 pt-6 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-blue-600 hover:underline"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
