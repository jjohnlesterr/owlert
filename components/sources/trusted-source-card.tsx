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
    <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,27,51,0.04)] sm:p-5">
      <div className="flex items-start gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy text-white">
          <ShieldCheck className="h-4 w-4" />
        </span>
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

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <Badge tone={trustLevelTone[source.trust_level]}>
          {trustLevelLabel[source.trust_level]}
        </Badge>
        <Badge tone={sourceStatusTone[source.status]}>
          {monitoringCapabilityLabel[source.status]}
        </Badge>
      </div>

      <p className="mt-2.5 text-xs text-slate-400">
        {source.last_checked_at
          ? `Last checked ${timeAgo(source.last_checked_at)}`
          : "Not checked yet"}
      </p>

      <div className="mt-3 border-t border-slate-100 pt-3">
        <CheckNowButton sourceId={source.id} />
      </div>
    </div>
  );
}
