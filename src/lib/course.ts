import type { CourseAvailability } from "@/db/schema";

export const AVAILABILITY_LABEL: Record<CourseAvailability, string> = {
  coming_soon: "Coming soon",
  open: "Enrolling",
  closed: "Closed",
};
