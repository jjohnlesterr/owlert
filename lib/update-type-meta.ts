import { CloudRain, GraduationCap, School } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { UpdateType } from "@/lib/types";

export const updateTypeLabel: Record<UpdateType, string> = {
  weather: "Weather",
  classes: "Classes",
  school: "School",
};

export const updateTypeIcon: Record<UpdateType, LucideIcon> = {
  weather: CloudRain,
  classes: GraduationCap,
  school: School,
};
