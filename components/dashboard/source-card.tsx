import { Bell, BellOff, PauseCircle, Radar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  sourceKindLabel,
  sourceKindTone,
  sourceStatusLabel,
  sourceStatusTone,
} from "@/lib/badge-meta";
import { timeAgo } from "@/lib/format";
import type { MonitoredSource } from "@/lib/types";

export function SourceCard({
  source,
  compact = false,
}: {
  source: MonitoredSource;
  compact?: boolean;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-navy">{source.name}</h3>
        <Badge tone={sourceStatusTone[source.status]}>
          {sourceStatusLabel[source.status]}
        </Badge>
      </div>

      <div className="mt-1.5">
        <Badge tone={sourceKindTone[source.kind]}>
          {sourceKindLabel[source.kind]}
        </Badge>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        {source.lastCheckedAt
          ? `Last checked ${timeAgo(source.lastCheckedAt)}`
          : "Not checked yet"}
      </p>

      {!compact && (
        <div className="mt-3 flex items-center gap-4 border-t border-slate-100 pt-3 text-xs font-medium">
          <span
            className={`inline-flex items-center gap-1 ${
              source.monitoringEnabled ? "text-blue-600" : "text-slate-400"
            }`}
          >
            {source.monitoringEnabled ? (
              <Radar className="h-3.5 w-3.5" />
            ) : (
              <PauseCircle className="h-3.5 w-3.5" />
            )}
            Monitoring {source.monitoringEnabled ? "On" : "Off"}
          </span>
          <span
            className={`inline-flex items-center gap-1 ${
              source.notificationsEnabled ? "text-blue-600" : "text-slate-400"
            }`}
          >
            {source.notificationsEnabled ? (
              <Bell className="h-3.5 w-3.5" />
            ) : (
              <BellOff className="h-3.5 w-3.5" />
            )}
            Alerts {source.notificationsEnabled ? "On" : "Off"}
          </span>
        </div>
      )}
    </Card>
  );
}
