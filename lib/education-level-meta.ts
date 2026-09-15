import type { EducationLevel } from "@/lib/types";

export const educationLevelLabel: Record<EducationLevel, string> = {
  elementary: "Elementary",
  junior_high: "Junior High School",
  senior_high: "Senior High School",
  college: "College",
  other: "Other",
};

export const educationLevelOptions: EducationLevel[] = [
  "elementary",
  "junior_high",
  "senior_high",
  "college",
  "other",
];
