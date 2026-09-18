import { AlertTriangle, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CheckNowButton } from "@/components/sources/check-now-button";
import { RemoveSourceButton } from "@/components/sources/remove-source-button";
import {
  sourceStatusLabel,
  sourceStatusTone,
  trustLevelLabel,
  trustLevelTone,
} from "@/lib/badge-meta";
import { timeAgo } from "@/lib/format";
import type { SourceRow } from "@/lib/types";

export function SourceListCard({ source }: { source: SourceRow }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-navy">
            {source.name}
          </h3>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-full items-center gap-1 text-xs text-slate-400 hover:text-blue-600 hover:underline"
          >
            <span className="truncate">{source.url}</span>
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
        </div>
        <Badge tone={sourceStatusTone[source.status]}>
          {sourceStatusLabel[source.status]}
        </Badge>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Badge tone={trustLevelTone[source.trust_level]}>
          {trustLevelLabel[source.trust_level]}
        </Badge>
      </div>

      {/* Monitoring readability ("status") and domain trust ("trust_level")
          are separate dimensions — this warning tracks status, since e.g. a
          Facebook page can be "limited" to read while its trust is
          evaluated independently (usually "Unverified"). */}
      {source.status === "limited" && (
        <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-2 text-xs text-amber-800">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Limited monitoring — BeeAlert may not be able to reliably read
          recent posts from this source.
        </p>
      )}
      {source.trust_level === "unverified" && (
        <p className="mt-1.5 text-xs text-slate-400">{source.trust_reason}</p>
      )}

      <p className="mt-3 text-xs text-slate-400">
        {source.last_checked_at
          ? `Last checked ${timeAgo(source.last_checked_at)}`
          : "Not checked yet"}
      </p>

      <div className="mt-3 flex items-start justify-between gap-2 border-t border-slate-100 pt-3">
        <CheckNowButton sourceId={source.id} />
        <RemoveSourceButton sourceId={source.id} sourceName={source.name} />
      </div>
    </Card>
  );
}
