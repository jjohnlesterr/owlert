"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";
import { inputClass } from "@/components/ui/form";

export function PasswordField({
  name,
  label,
  autoComplete,
  minLength,
}: {
  name: string;
  label: string;
  autoComplete: string;
  minLength?: number;
}) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          name={name}
          required
          minLength={minLength}
          autoComplete={autoComplete}
          className={`${inputClass} pr-11`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          tabIndex={-1}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition-colors hover:text-slate-600"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
