import type { InPickerOption } from "./types";

export const ALL_PICKER_VALUE = "";

export function toStringPickerValue(value: string | undefined | null): string {
  return value ?? ALL_PICKER_VALUE;
}

export function resolveStringPickerFilter(
  value: string | number | boolean | null,
): string | undefined {
  return typeof value === "string" && value !== ALL_PICKER_VALUE ? value : undefined;
}

export function toBooleanPickerValue(value: boolean | undefined): string | boolean {
  return value ?? ALL_PICKER_VALUE;
}

export function resolveBooleanPickerFilter(
  value: string | number | boolean | null,
): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

export function withAllPickerOption<T extends string | number | boolean>(
  options: Array<{ label: string; value: T; disabled?: boolean }>,
  allLabel = "全部",
): Array<InPickerOption> {
  return [{ value: ALL_PICKER_VALUE, label: allLabel }, ...options];
}
