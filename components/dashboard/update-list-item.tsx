import { ChevronRight } from "lucide-react";
import { updateTypeIcon } from "@/lib/update-type-meta";
import { timeAgo } from "@/lib/format";
import type { UpdateItem } from "@/lib/types";

// Distinct from Badge's trust/status tones — these are purely category
// accents for the compact list row, so weather/classes/school never share
// a color with each other or with a trust/severity badge elsewhere.
const categoryStyle: Record<UpdateItem["type"], string> = {
  weather: "bg-blue-50 text-blue-600",
  classes: "bg-violet-50 text-violet-600",
  school: "bg-navy/5 text-navy",
};

export function UpdateListItem({ update }: { update: UpdateItem }) {
  const Icon = updateTypeIcon[update.type];

  return (
    <a
      href={update.originalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-[0_1px_2px_rgba(15,27,51,0.04)] transition-colors hover:bg-slate-50"
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${categoryStyle[update.type]}`}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-sm font-semibold text-navy">
            {update.title}
          </p>
          <span className="shrink-0 text-[11px] text-slate-400">
            {timeAgo(update.publishedAt)}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-slate-500">
          {update.summary}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
    </a>
  );
}
