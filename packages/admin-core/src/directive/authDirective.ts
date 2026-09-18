import type { Directive } from "vue";
import { storeToRefs } from "pinia";
import { usePermissions } from "@/stores/modules/auth";

const matchesAction = (required: string, actionCodes: Array<string>, unavailable: boolean): boolean =>
  !unavailable && actionCodes.includes(required);

const applyVisibility = (el: HTMLElement, allowed: boolean): void => {
  el.hidden = !allowed;
  el.style.display = allowed ? "" : "none";
  el.setAttribute("aria-hidden", allowed ? "false" : "true");
};

const bindReactiveAuth = (
  el: HTMLElement,
  getter: () => boolean,
): void => {
  const stop = watch(getter, (allowed) => applyVisibility(el, allowed), { immediate: true });
  const record = el as HTMLElement & { __iamAuthStop?: () => void };
  record.__iamAuthStop?.();
  record.__iamAuthStop = stop;
};

export const authDirective: Directive<HTMLElement, string> = {
  mounted(el, binding) {
    const store = usePermissions();
    const { permissions, unavailable } = storeToRefs(store);
    bindReactiveAuth(el, () => matchesAction(binding.value, permissions.value, unavailable.value));
  },
  updated(el, binding) {
    const store = usePermissions();
    const { permissions, unavailable } = storeToRefs(store);
    bindReactiveAuth(el, () => matchesAction(binding.value, permissions.value, unavailable.value));
  },
  unmounted(el) {
    const record = el as HTMLElement & { __iamAuthStop?: () => void };
    record.__iamAuthStop?.();
  },
};

export const authAnyDirective: Directive<HTMLElement, string[]> = {
  mounted(el, binding) {
    const store = usePermissions();
    const { permissions, unavailable } = storeToRefs(store);
    bindReactiveAuth(el, () =>
      (binding.value ?? []).some((auth) => matchesAction(auth, permissions.value, unavailable.value)),
    );
  },
  updated(el, binding) {
    const store = usePermissions();
    const { permissions, unavailable } = storeToRefs(store);
    bindReactiveAuth(el, () =>
      (binding.value ?? []).some((auth) => matchesAction(auth, permissions.value, unavailable.value)),
    );
  },
  unmounted(el) {
    const record = el as HTMLElement & { __iamAuthStop?: () => void };
    record.__iamAuthStop?.();
  },
};

export const authAllDirective: Directive<HTMLElement, string[]> = {
  mounted(el, binding) {
    const store = usePermissions();
    const { permissions, unavailable } = storeToRefs(store);
    bindReactiveAuth(el, () =>
      (binding.value ?? []).every((auth) => matchesAction(auth, permissions.value, unavailable.value)),
    );
  },
  updated(el, binding) {
    const store = usePermissions();
    const { permissions, unavailable } = storeToRefs(store);
    bindReactiveAuth(el, () =>
      (binding.value ?? []).every((auth) => matchesAction(auth, permissions.value, unavailable.value)),
    );
  },
  unmounted(el) {
    const record = el as HTMLElement & { __iamAuthStop?: () => void };
    record.__iamAuthStop?.();
  },
};
