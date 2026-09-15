import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Laptop,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { BadgeTone } from "@/components/ui/badge";
import type { ClassStatusValue } from "@/lib/types";

export const classStatusLabel: Record<ClassStatusValue, string> = {
  no_announcement: "No Announcement Yet",
  continue: "Classes Continue",
  suspended: "Classes Suspended",
  online: "Online Classes",
  partial: "Partial Suspension",
};

export const classStatusTone: Record<ClassStatusValue, BadgeTone> = {
  no_announcement: "neutral",
  continue: "safe",
  suspended: "critical",
  online: "info",
  partial: "warning",
};

export const classStatusIcon: Record<ClassStatusValue, LucideIcon> = {
  no_announcement: HelpCircle,
  continue: CheckCircle2,
  suspended: XCircle,
  online: Laptop,
  partial: AlertTriangle,
};
