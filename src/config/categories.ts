import categoryData from "./categories.json";

export const CATEGORY_LABELS = categoryData;

export type CategoryKey = keyof typeof CATEGORY_LABELS;

export const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS) as CategoryKey[];

export function isCategoryKey(value: string): value is CategoryKey {
  return Object.hasOwn(CATEGORY_LABELS, value);
}

export function getCategoryLabel(category: CategoryKey): string {
  return CATEGORY_LABELS[category];
}
