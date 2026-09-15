import { AlertTriangle, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { severityLabel, severityTone, sourceKindLabel, sourceKindTone } from "@/lib/badge-meta";
import { timeAgo } from "@/lib/format";
import type { AdvisoryInfo } from "@/lib/types";

const severityBorder: Record<AdvisoryInfo["severity"], string> = {
  info: "border-l-blue-400",
  advisory: "border-l-amber-400",
  warning: "border-l-amber-500",
  critical: "border-l-red-500",
};

export function AdvisoryCard({ advisory }: { advisory: AdvisoryInfo }) {
  return (
    <Card className={`border-l-4 ${severityBorder[advisory.severity]}`}>
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <AlertTriangle className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={severityTone[advisory.severity]}>
              {severityLabel[advisory.severity]}
            </Badge>
            <Badge tone={sourceKindTone[advisory.source.kind]}>
              {sourceKindLabel[advisory.source.kind]}
            </Badge>
          </div>
          <h3 className="mt-1.5 text-base font-semibold text-navy">
            {advisory.title}
          </h3>
          <p className="mt-1 text-sm text-slate-600">{advisory.summary}</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
            <span>{advisory.location}</span>
            <span>&middot;</span>
            <span>Issued {timeAgo(advisory.issuedAt)}</span>
          </div>

          <a
            href={advisory.source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
          >
            View source: {advisory.source.name}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </Card>
  );
}
