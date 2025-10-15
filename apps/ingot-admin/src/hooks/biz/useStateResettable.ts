import { shallowRef, type Ref } from "vue";
export function useStateResettableFn<T>(action: () => T): {
  state: Ref<T>;
  reset: () => void;
} {
  const state = shallowRef<T>(action());
  const reset = () => {
    state.value = action();
  };

  return { state, reset };
}

function defaultDeepClone(value: any) {
  if (value == null || typeof value != "object") return value;
  return JSON.parse(JSON.stringify(value));
}

export function useStateResettable<T>(
  value: T,
  deepClone = defaultDeepClone,
): {
  state: Ref<T>;
  reset: () => void;
} {
  const initialValue = deepClone(value);
  const state = shallowRef<T>(value);
  const reset = () => {
    state.value = deepClone(initialValue);
  };

  return { state, reset };
}
