import { ExternalLink } from "lucide-react";
import { redirect } from "next/navigation";
import { AddSourceForm } from "@/components/sources/add-source-form";
import { SourceListCard } from "@/components/sources/source-list-card";
import { TrustedSourceCard } from "@/components/sources/trusted-source-card";
import { Card } from "@/components/ui/card";
import { getAuthUser } from "@/lib/dal";
import { timeAgo } from "@/lib/format";
import { ensureBuiltInSources } from "@/lib/sources/built-in";
import { createClient } from "@/lib/supabase/server";
import type { SourceRow, SourceUpdateRow } from "@/lib/types";

export default async function SourcesPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();

  // No-op after the first visit — see lib/sources/built-in.ts.
  await ensureBuiltInSources(supabase, user.id);

  const [{ data: sources }, { data: updates }] = await Promise.all([
    supabase
      .from("sources")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .returns<SourceRow[]>(),
    supabase
      .from("source_updates")
      .select("*")
      .eq("user_id", user.id)
      .order("detected_at", { ascending: false })
      .limit(10)
      .returns<SourceUpdateRow[]>(),
  ]);

  const trustedSources = (sources ?? []).filter((s) => s.is_builtin);
  const customSources = (sources ?? []).filter((s) => !s.is_builtin);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-semibold text-navy">Sources</h1>
        <p className="text-sm text-slate-500">
          Owlert-managed trusted sources plus any websites or feeds you add
          yourself, all checked for weather-related updates.
        </p>
      </header>

      <section>
        <h2 className="mb-3 text-base font-semibold text-navy">
          Trusted Sources
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {trustedSources.map((source) => (
            <TrustedSourceCard key={source.id} source={source} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-navy">My Sources</h2>
        <AddSourceForm />
        {customSources.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {customSources.map((source) => (
              <SourceListCard key={source.id} source={source} />
            ))}
          </div>
        ) : (
          <Card className="mt-4">
            <p className="text-sm text-slate-500">
              No custom sources yet. Paste a URL above to start monitoring
              one.
            </p>
          </Card>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-navy">
          Recent Detections
        </h2>
        {updates && updates.length > 0 ? (
          <div className="flex flex-col gap-3">
            {updates.map((update) => (
              <Card key={update.id}>
                <h3 className="text-sm font-semibold text-navy">
                  {update.title}
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  {update.summary}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                  {update.location && <span>{update.location}</span>}
                  {update.location && <span>&middot;</span>}
                  <span>Detected {timeAgo(update.detected_at)}</span>
                </div>
                <a
                  href={update.original_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                >
                  View Source
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <p className="text-sm text-slate-500">
              No weather-related updates detected yet. Add a source and click
              Check Now.
            </p>
          </Card>
        )}
      </section>
    </div>
  );
}
