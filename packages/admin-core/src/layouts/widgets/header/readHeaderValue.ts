import { isRef } from "vue";
import type { InAdminHeaderReactive } from "@/plugin/header";

export const readHeaderValue = <T>(
  value: InAdminHeaderReactive<T> | undefined,
  fallback: T,
): T => {
  if (value === undefined) {
    return fallback;
  }
  if (isRef(value)) {
    return value.value as T;
  }
  if (typeof value === "function") {
    return (value as () => T)();
  }
  return value;
};
