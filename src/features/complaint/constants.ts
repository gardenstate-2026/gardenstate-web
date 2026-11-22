import type { ComplaintCategory, TimeOfDay } from "./types";

export const CATEGORY_META: Record<
  ComplaintCategory,
  { label: string; color: string }
> = {
  noise: { label: "소음", color: "var(--cat-noise)" },
  pet: { label: "반려견", color: "var(--cat-pet)" },
  traffic: { label: "통행", color: "var(--cat-traffic)" },
  smell: { label: "냄새", color: "var(--cat-smell)" },
  light: { label: "조명", color: "var(--cat-light)" },
  shade: { label: "그늘", color: "var(--cat-shade)" },
  etc: { label: "기타", color: "var(--cat-etc)" },
};

export const CATEGORIES = Object.keys(CATEGORY_META) as ComplaintCategory[];

export const TIME_LABEL: Record<TimeOfDay, string> = {
  dawn: "새벽·아침",
  day: "주간",
  evening: "저녁",
  night: "야간",
  unknown: "시간대 미상",
};
