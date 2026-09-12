import type { Directive } from "vue";
import { usePermissions } from "@/stores/modules/auth";

const matchesAuth = (required: string, permissions: Array<string>, roles: Array<string>): boolean =>
  permissions.includes(required) || roles.includes(required);

const removeIfUnauthorized = (el: HTMLElement, allowed: boolean): void => {
  if (allowed) {
    return;
  }
  el.parentNode?.removeChild(el);
};

export const authDirective: Directive<HTMLElement, string> = {
  mounted(el, binding) {
    const store = usePermissions();
    removeIfUnauthorized(el, matchesAuth(binding.value, store.permissions, store.roles));
  },
};

export const authAnyDirective: Directive<HTMLElement, string[]> = {
  mounted(el, binding) {
    const store = usePermissions();
    const allowed = binding.value.some((auth) => matchesAuth(auth, store.permissions, store.roles));
    removeIfUnauthorized(el, allowed);
  },
};

export const authAllDirective: Directive<HTMLElement, string[]> = {
  mounted(el, binding) {
    const store = usePermissions();
    const allowed = binding.value.every((auth) => matchesAuth(auth, store.permissions, store.roles));
    removeIfUnauthorized(el, allowed);
  },
};
