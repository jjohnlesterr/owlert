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
    <Card compact>
      <div className="flex items-start gap-2.5 sm:gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-11 sm:w-11 ${toneIconSurface[tone]}`}
        >
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">
            Class Status &middot; {status.location}
          </p>
          <h3 className="mt-0.5 text-base font-semibold text-navy sm:text-lg">
            {classStatusLabel[status.status]}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs text-slate-600 sm:text-sm">
            {status.note}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 sm:mt-3 sm:text-xs">
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
              <span className="italic">Awaiting an announcement</span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
