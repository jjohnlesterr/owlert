"use client";

import { useActionState } from "react";
import { logout } from "@/lib/actions/auth";
import { updateProfile } from "@/lib/actions/profile";
import { Field, inputClass, selectClass } from "@/components/ui/form";
import {
  educationLevelLabel,
  educationLevelOptions,
} from "@/lib/education-level-meta";
import { PH_REGIONS, type PhRegionCode } from "@/lib/ph-regions";
import type { EducationLevel, NotificationPreferences } from "@/lib/types";

interface ProfileFormInitial {
  full_name: string;
  school: string;
  city: string;
  province: string;
  education_level: EducationLevel | null;
  preferred_region: PhRegionCode | null;
  notification_preferences: NotificationPreferences;
}

function SectionLabel({ children }: { children: string }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
      {children}
    </h2>
  );
}

export function ProfileForm({ initial }: { initial: ProfileFormInitial }) {
  const [state, formAction, pending] = useActionState(
    updateProfile,
    undefined,
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-6 rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,27,51,0.04)] sm:p-6"
    >
      <div className="flex flex-col gap-4">
        <SectionLabel>Personal information</SectionLabel>
        <Field label="Full name">
          <input
            name="full_name"
            defaultValue={initial.full_name}
            required
            className={inputClass}
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="School">
            <input
              name="school"
              defaultValue={initial.school}
              className={inputClass}
            />
          </Field>
          <Field label="Education level">
            <select
              name="education_level"
              defaultValue={initial.education_level ?? ""}
              className={selectClass}
            >
              <option value="">Not set</option>
              {educationLevelOptions.map((level) => (
                <option key={level} value={level}>
                  {educationLevelLabel[level]}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      <div className="flex flex-col gap-4 border-t border-slate-100 pt-6">
        <SectionLabel>Location</SectionLabel>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="City">
            <input
              name="city"
              defaultValue={initial.city}
              className={inputClass}
            />
          </Field>
          <Field label="Province">
            <input
              name="province"
              defaultValue={initial.province}
              className={inputClass}
            />
          </Field>
        </div>
      </div>

      <div className="flex flex-col gap-4 border-t border-slate-100 pt-6">
        <SectionLabel>Preferred region</SectionLabel>
        <Field label="Region used to filter your updates">
          <select
            name="preferred_region"
            defaultValue={initial.preferred_region ?? ""}
            className={selectClass}
          >
            <option value="">All Regions</option>
            {PH_REGIONS.map((region) => (
              <option key={region.code} value={region.code}>
                {region.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <fieldset className="flex flex-col gap-3 border-t border-slate-100 pt-6">
        <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Notifications
        </legend>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            name="notify_weather"
            defaultChecked={initial.notification_preferences.weather}
            className="h-4 w-4 rounded border-slate-300 text-navy focus:ring-navy/30"
          />
          Weather advisories
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            name="notify_classes"
            defaultChecked={initial.notification_preferences.classes}
            className="h-4 w-4 rounded border-slate-300 text-navy focus:ring-navy/30"
          />
          Class status updates
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            name="notify_school"
            defaultChecked={initial.notification_preferences.school}
            className="h-4 w-4 rounded border-slate-300 text-navy focus:ring-navy/30"
          />
          School announcements
        </label>
      </fieldset>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && (
        <p className="text-sm text-green-700">Profile saved.</p>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-light disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
        <button
          type="submit"
          formAction={logout}
          className="text-sm font-medium text-red-600 hover:underline"
        >
          Log out
        </button>
      </div>
    </form>
  );
}
