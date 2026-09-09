/**
 * Returns Tailwind CSS classes for framing a profile photo according to face area and body.
 * @param position - "top" (Face & Head focus), "center" (Upper Body / Chest), "bottom" (Lower body focus), or "fit" (Full Contain)
 */
export function getPhotoPositionClass(position?: "top" | "center" | "bottom" | "fit"): string {
  switch (position) {
    case "top":
      // Focuses on face and forehead in top 15%, keeping head centered
      return "object-cover object-[center_15%]";
    case "center":
      // Focuses on upper body / chest area
      return "object-cover object-[center_38%]";
    case "bottom":
      return "object-cover object-bottom";
    case "fit":
      // Fits entire photo without cropping
      return "object-contain bg-slate-100/90 p-1";
    default:
      // Optimal smart framing for face & upper body (20% from top)
      return "object-cover object-[center_20%]";
  }
}

export const PHOTO_POSITION_OPTIONS = [
  {
    id: "top" as const,
    label: "Face Focus",
    subLabel: "Aligns face and head at frame top",
  },
  {
    id: "center" as const,
    label: "Upper Body",
    subLabel: "Balances face & shoulders",
  },
  {
    id: "fit" as const,
    label: "Full Fit",
    subLabel: "Displays entire photo without crop",
  }
];
