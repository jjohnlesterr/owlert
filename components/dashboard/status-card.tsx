import { ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { toneIconSurface } from "@/lib/badge-meta";
import {
  classStatusIcon,
  classStatusLabel,
  classStatusTone,
} from "@/lib/class-status-meta";
import { timeAgo } from "@/lib/format";
import type { ClassStatusInfo } from "@/lib/types";

export function StatusCard({ status }: { status: ClassStatusInfo }) {
  const Icon = classStatusIcon[status.status];
  const tone = classStatusTone[status.status];

  return (
    <Card>
      <div className="flex items-start gap-3">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${toneIconSurface[tone]}`}
        >
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Class Status &middot; {status.location}
          </p>
          <h3 className="mt-0.5 text-lg font-semibold text-navy">
            {classStatusLabel[status.status]}
          </h3>
          <p className="mt-1 text-sm text-slate-600">{status.note}</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
            <span>Updated {timeAgo(status.updatedAt)}</span>
            {status.source ? (
              <a
                href={status.source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline"
              >
                {status.source.name}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <span className="italic">Awaiting an official announcement</span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
