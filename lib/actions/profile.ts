"use server";

import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { isPhRegionCode } from "@/lib/ph-regions";
import type { EducationLevel } from "@/lib/types";

export interface ProfileActionState {
  error?: string;
  success?: boolean;
}

const EDUCATION_LEVELS: EducationLevel[] = [
  "elementary",
  "junior_high",
  "senior_high",
  "college",
  "other",
];

export async function updateProfile(
  _prevState: ProfileActionState | undefined,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await getAuthUser();
  if (!user) {
    return { error: "Your session expired. Please log in again." };
  }

  const fullName = String(formData.get("full_name") ?? "").trim();
  if (!fullName) {
    return { error: "Full name can't be empty." };
  }

  const school = String(formData.get("school") ?? "").trim() || null;
  const city = String(formData.get("city") ?? "").trim() || null;
  const province = String(formData.get("province") ?? "").trim() || null;

  const educationLevelRaw = String(formData.get("education_level") ?? "");
  const educationLevel = EDUCATION_LEVELS.includes(
    educationLevelRaw as EducationLevel,
  )
    ? (educationLevelRaw as EducationLevel)
    : null;

  const preferredRegionRaw = String(formData.get("preferred_region") ?? "");
  const preferredRegion = isPhRegionCode(preferredRegionRaw)
    ? preferredRegionRaw
    : null;

  const notificationPreferences = {
    weather: formData.get("notify_weather") === "on",
    classes: formData.get("notify_classes") === "on",
    school: formData.get("notify_school") === "on",
  };

  const supabase = await createClient();
  // upsert (rather than update) tolerates the profile row not existing yet
  // — e.g. if the Phase 2 SQL trigger hasn't been run against this project.
  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      full_name: fullName,
      school,
      city,
      province,
      education_level: educationLevel,
      preferred_region: preferredRegion,
      notification_preferences: notificationPreferences,
    },
    { onConflict: "id" },
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/profile");
  return { success: true };
}
