"use server";

import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { checkSource, type CheckSourceResult, type DetectedUpdate } from "@/lib/sources/check-source";
import { classifyTrust } from "@/lib/sources/trust";
import { phRegionLabel, type PhRegionCode } from "@/lib/ph-regions";

async function getPreferredRegion(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<PhRegionCode | null> {
  const { data } = await supabase
    .from("profiles")
    .select("preferred_region")
    .eq("id", userId)
    .maybeSingle<{ preferred_region: PhRegionCode | null }>();
  return data?.preferred_region ?? null;
}

/**
 * Builds the "found an update" message, noting when the detected content
 * doesn't mention the user's preferred region — region filtering (Feature 6)
 * still saves it (it may match other views/filters), it just doesn't claim
 * relevance it can't back up.
 */
function describeFoundUpdate(
  baseMessage: string,
  update: DetectedUpdate,
  preferredRegion: PhRegionCode | null,
): string {
  if (
    !preferredRegion ||
    update.affectedRegions.length === 0 ||
    update.affectedRegions.includes(preferredRegion)
  ) {
    return baseMessage;
  }
  return `${baseMessage}. Note: it doesn't mention your preferred region (${phRegionLabel[preferredRegion]}) — it's saved and will show up if you switch your region filter.`;
}

function describeNoNewUpdates(result: CheckSourceResult): string {
  if (result.status === "limited") {
    // Prefer the specific reason when checkSource provided one (e.g. the
    // Facebook-specific message) over the generic fallback.
    return (
      result.errorMessage ??
      "Limited monitoring — BeeAlert could not reliably read recent posts from this source."
    );
  }
  return "No new relevant updates.";
}

export interface AddSourceState {
  error?: string;
  success?: boolean;
  message?: string;
}

export async function addSource(
  _prevState: AddSourceState | undefined,
  formData: FormData,
): Promise<AddSourceState> {
  const user = await getAuthUser();
  if (!user) {
    return { error: "Your session expired. Please log in again." };
  }

  const rawUrl = String(formData.get("url") ?? "").trim();
  if (!rawUrl) {
    return { error: "Enter a URL." };
  }

  let result: CheckSourceResult;
  try {
    result = await checkSource(rawUrl);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Couldn't validate that URL.",
    };
  }

  const supabase = await createClient();
  const trust = classifyTrust(new URL(result.resolvedUrl).hostname, result.status);

  const { data: source, error: insertError } = await supabase
    .from("sources")
    .insert({
      user_id: user.id,
      url: result.resolvedUrl,
      name: result.sourceName,
      status: result.status,
      trust_level: trust.level,
      trust_reason: trust.reason,
      last_checked_at: new Date().toISOString(),
    })
    .select("id")
    .single<{ id: string }>();

  if (insertError) {
    if (insertError.code === "23505") {
      return { error: "You've already added this source." };
    }
    return { error: insertError.message };
  }

  let foundUpdate = false;
  if (result.update) {
    const { error: updateInsertError } = await supabase
      .from("source_updates")
      .insert({
        source_id: source.id,
        user_id: user.id,
        content_hash: result.update.contentHash,
        title: result.update.title,
        summary: result.update.summary,
        category: result.update.category,
        location: result.update.locationLabel,
        affected_regions: result.update.affectedRegions,
        detected_locations: result.update.detectedLocations,
        original_url: result.update.originalUrl,
        published_at: result.update.publishedAt,
      });
    foundUpdate = !updateInsertError;
  }

  revalidatePath("/sources");
  revalidatePath("/updates");
  revalidatePath("/");

  const preferredRegion = await getPreferredRegion(supabase, user.id);

  return {
    success: true,
    message:
      result.status === "unsupported"
        ? `Added, but couldn't read it yet: ${result.errorMessage ?? "unknown error."}`
        : foundUpdate && result.update
          ? describeFoundUpdate(
              `Added — found a weather-related update: "${result.update.title}"`,
              result.update,
              preferredRegion,
            )
          : `Added — ${describeNoNewUpdates(result)}`,
  };
}

export interface CheckNowState {
  error?: string;
  message?: string;
  foundNew?: boolean;
}

export async function checkSourceNow(
  _prevState: CheckNowState | undefined,
  formData: FormData,
): Promise<CheckNowState> {
  const user = await getAuthUser();
  if (!user) {
    return { error: "Your session expired. Please log in again." };
  }

  const sourceId = String(formData.get("source_id") ?? "");
  if (!sourceId) {
    return { error: "Missing source." };
  }

  const supabase = await createClient();
  const { data: source } = await supabase
    .from("sources")
    .select("id, url")
    .eq("id", sourceId)
    .eq("user_id", user.id)
    .maybeSingle<{ id: string; url: string }>();

  if (!source) {
    return { error: "Source not found." };
  }

  let result: CheckSourceResult;
  try {
    result = await checkSource(source.url);
  } catch (error) {
    const trust = classifyTrust(new URL(source.url).hostname, "unsupported");
    await supabase
      .from("sources")
      .update({
        status: "unsupported",
        trust_level: trust.level,
        trust_reason: trust.reason,
        last_checked_at: new Date().toISOString(),
      })
      .eq("id", sourceId);
    revalidatePath("/sources");
    return {
      error: error instanceof Error ? error.message : "Couldn't check that source.",
    };
  }

  const trust = classifyTrust(new URL(result.resolvedUrl).hostname, result.status);
  await supabase
    .from("sources")
    .update({
      status: result.status,
      trust_level: trust.level,
      trust_reason: trust.reason,
      last_checked_at: new Date().toISOString(),
    })
    .eq("id", sourceId);

  let foundNew = false;
  if (result.update) {
    const { error: insertError } = await supabase.from("source_updates").insert({
      source_id: sourceId,
      user_id: user.id,
      content_hash: result.update.contentHash,
      title: result.update.title,
      summary: result.update.summary,
      category: result.update.category,
      location: result.update.locationLabel,
      affected_regions: result.update.affectedRegions,
      detected_locations: result.update.detectedLocations,
      original_url: result.update.originalUrl,
      published_at: result.update.publishedAt,
    });
    // A unique_violation on (source_id, content_hash) just means we've
    // already saved this exact content before — not a new update.
    foundNew = !insertError;
  }

  revalidatePath("/sources");
  revalidatePath("/updates");
  revalidatePath("/");

  const preferredRegion = await getPreferredRegion(supabase, user.id);

  return {
    foundNew,
    message:
      foundNew && result.update
        ? describeFoundUpdate(
            `New weather-related update found: "${result.update.title}"`,
            result.update,
            preferredRegion,
          )
        : result.status === "unsupported"
          ? (result.errorMessage ?? "Couldn't read this source.")
          : describeNoNewUpdates(result),
  };
}

export interface RemoveSourceState {
  error?: string;
  success?: boolean;
}

export async function removeSource(
  _prevState: RemoveSourceState | undefined,
  formData: FormData,
): Promise<RemoveSourceState> {
  const user = await getAuthUser();
  if (!user) {
    return { error: "Your session expired. Please log in again." };
  }

  const sourceId = String(formData.get("source_id") ?? "");
  if (!sourceId) {
    return { error: "Missing source." };
  }

  const supabase = await createClient();

  // Ownership check up front — defense in depth alongside RLS, and gives a
  // clearer error than a silent no-op delete if the id is wrong/stale.
  const { data: source } = await supabase
    .from("sources")
    .select("id, is_builtin")
    .eq("id", sourceId)
    .eq("user_id", user.id)
    .maybeSingle<{ id: string; is_builtin: boolean }>();

  if (!source) {
    return { error: "Source not found." };
  }

  // Defense in depth alongside the RLS policy (supabase/phase7.sql), which
  // already blocks this at the database level.
  if (source.is_builtin) {
    return { error: "Built-in trusted sources can't be removed." };
  }

  // Delete detections first, then the source itself. Both statements are
  // still scoped by user_id in addition to RLS (auth.uid() = user_id on
  // both tables — see supabase/phase4.sql and supabase/phase6.sql), so a
  // user can only ever remove their own data.
  const { error: deleteUpdatesError } = await supabase
    .from("source_updates")
    .delete()
    .eq("source_id", sourceId)
    .eq("user_id", user.id);

  if (deleteUpdatesError) {
    return { error: deleteUpdatesError.message };
  }

  const { error: deleteSourceError } = await supabase
    .from("sources")
    .delete()
    .eq("id", sourceId)
    .eq("user_id", user.id);

  if (deleteSourceError) {
    return { error: deleteSourceError.message };
  }

  revalidatePath("/sources");
  revalidatePath("/updates");
  revalidatePath("/");

  return { success: true };
}
