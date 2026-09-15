import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  severityLabel,
  severityTone,
  sourceKindLabel,
  sourceKindTone,
  trustLevelLabel,
  trustLevelTone,
} from "@/lib/badge-meta";
import { timeAgo } from "@/lib/format";
import { updateTypeIcon, updateTypeLabel } from "@/lib/update-type-meta";
import {
  computeUpdateFreshness,
  updateFreshnessLabel,
  updateFreshnessTone,
} from "@/lib/updates/freshness";
import type { UpdateItem } from "@/lib/types";

export function UpdateCard({ update }: { update: UpdateItem }) {
  const TypeIcon = updateTypeIcon[update.type];
  const freshness = computeUpdateFreshness(update.publishedAt, update.detectedAt);

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="neutral" icon={<TypeIcon className="h-3.5 w-3.5" />}>
          {updateTypeLabel[update.type]}
        </Badge>
        {update.severity && (
          <Badge tone={severityTone[update.severity]}>
            {severityLabel[update.severity]}
          </Badge>
        )}
        {update.source.trustLevel ? (
          <Badge tone={trustLevelTone[update.source.trustLevel]}>
            {trustLevelLabel[update.source.trustLevel]}
          </Badge>
        ) : (
          <Badge tone={sourceKindTone[update.source.kind]}>
            {sourceKindLabel[update.source.kind]}
          </Badge>
        )}
        {freshness !== "uncertain" && (
          <Badge tone={updateFreshnessTone[freshness]}>
            {updateFreshnessLabel[freshness]}
          </Badge>
        )}
      </div>

      <h3 className="mt-2 text-sm font-semibold text-navy">{update.title}</h3>
      <p className="mt-1 text-sm text-slate-600">{update.summary}</p>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
        <span>{update.source.name}</span>
        {update.location && (
          <>
            <span>&middot;</span>
            <span>{update.location}</span>
          </>
        )}
        <span>&middot;</span>
        <span>Published {timeAgo(update.publishedAt)}</span>
      </div>

      <a
        href={update.originalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
      >
        View Original Source
        <ExternalLink className="h-3 w-3" />
      </a>
    </Card>
  );
}
