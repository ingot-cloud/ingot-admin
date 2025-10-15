import type { App } from "vue";
import { usePermissions } from "@/stores/modules/auth";

export function authDirective(app: App) {
  // 单个权限验证（v-auth="xxx"）
  app.directive("auth", {
    mounted(el, binding) {
      const permissions = usePermissions();
      const reqAuth = binding.value as string;

      // 当前用户没有该权限且没有该角色，移除元素
      if (
        permissions.authorities.some((v: string) => reqAuth.startsWith(v)) ||
        permissions.roles.some((v: string) => v === reqAuth)
      ) {
        return;
      }

      el.parentNode && el.parentNode.removeChild(el);
    },
  });
  // 多个权限验证，满足一个则显示（v-auth-any="[xxx,xxx]"）
  app.directive("auth-any", {
    mounted(el, binding) {
      const permissions = usePermissions();
      const reqAuths = binding.value;

      // 检查角色
      let result = permissions.roles.some((role: string) => {
        return reqAuths.some((auth: string) => auth === role);
      });
      if (result) {
        return;
      }
      // 检查权限
      result = permissions.authorities.some((v: string) => {
        return reqAuths.some((auth: string) => auth.startsWith(v));
      });
      if (result) {
        return;
      }

      el.parentNode && el.parentNode.removeChild(el);
    },
  });
  // 多个权限验证，全部满足则显示（v-auth-all="[xxx,xxx]"）
  app.directive("auth-all", {
    mounted(el, binding) {
      const permissions = usePermissions();
      const reqAuths = binding.value;

      const userAuths = [...permissions.roles, ...permissions.authorities];

      const result = reqAuths.every((auth: string) =>
        userAuths.some((v: string) => auth.startsWith(v)),
      );
      if (result) {
        return;
      }

      el.parentNode && el.parentNode.removeChild(el);
    },
  });
}
