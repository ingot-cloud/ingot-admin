import "./styles";
import type { App } from "vue";
import type { AuthSession } from "@ingot/auth-core";
import { AUTH_SESSION_KEY } from "./session";
import { createAuthRoutes } from "./routes";
export { useAuthAppearance } from "./appearance";
export type { AuthColorScheme } from "./appearance";
export { AUTH_SESSION_KEY, provideAuthSession, useAuthSession } from "./session";
export type { AuthAppearance, AuthSession } from "./session";
export { createAuthRoutes } from "./routes";
/** App组合能力；插件只依赖公共契约，不反向依赖管理框架实现。 */
export const createAuthPlugin = (session: () => AuthSession) => ({
  id: "ingot-auth",
  apiVersion: 1 as const,
  dependsOn: ["ingot-admin-core"],
  staticRoutes: createAuthRoutes(),
  install: ({ app }: { app: App }): void => {
    app.provide(AUTH_SESSION_KEY, session());
  },
});
