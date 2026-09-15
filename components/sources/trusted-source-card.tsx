import { ExternalLink, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CheckNowButton } from "@/components/sources/check-now-button";
import {
  monitoringCapabilityLabel,
  sourceStatusTone,
  trustLevelLabel,
  trustLevelTone,
} from "@/lib/badge-meta";
import { timeAgo } from "@/lib/format";
import type { SourceRow } from "@/lib/types";

export function TrustedSourceCard({ source }: { source: SourceRow }) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 shadow-sm shadow-blue-100/50 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
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
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Badge tone={trustLevelTone[source.trust_level]}>
          {trustLevelLabel[source.trust_level]}
        </Badge>
        <Badge tone={sourceStatusTone[source.status]}>
          {monitoringCapabilityLabel[source.status]}
        </Badge>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        {source.last_checked_at
          ? `Last checked ${timeAgo(source.last_checked_at)}`
          : "Not checked yet"}
      </p>

      <div className="mt-3 border-t border-blue-100 pt-3">
        <CheckNowButton sourceId={source.id} />
      </div>
    </div>
  );
}
