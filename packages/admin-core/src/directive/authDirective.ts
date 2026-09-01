import type { Directive } from "vue";
import { usePermissions } from "@/stores/modules/auth";

const removeIfUnauthorized = (el: HTMLElement, allowed: boolean): void => {
  if (allowed) {
    return;
  }
  el.parentNode?.removeChild(el);
};

export const authDirective: Directive<HTMLElement, string> = {
  mounted(el, binding) {
    const permissions = usePermissions();
    const reqAuth = binding.value;
    const allowed =
      permissions.permissions.some((item) => reqAuth.startsWith(item)) ||
      permissions.roles.some((item) => item === reqAuth);
    removeIfUnauthorized(el, allowed);
  },
};

export const authAnyDirective: Directive<HTMLElement, string[]> = {
  mounted(el, binding) {
    const permissions = usePermissions();
    const reqAuths = binding.value;
    const roleMatched = permissions.roles.some((role) => reqAuths.some((auth) => auth === role));
    if (roleMatched) {
      return;
    }
    const permissionMatched = permissions.permissions.some((item) =>
      reqAuths.some((auth) => auth.startsWith(item)),
    );
    removeIfUnauthorized(el, permissionMatched);
  },
};

export const authAllDirective: Directive<HTMLElement, string[]> = {
  mounted(el, binding) {
    const permissions = usePermissions();
    const reqAuths = binding.value;
    const userAuths = [...permissions.roles, ...permissions.permissions];
    const allowed = reqAuths.every((auth) => userAuths.some((item) => auth.startsWith(item)));
    removeIfUnauthorized(el, allowed);
  },
};
