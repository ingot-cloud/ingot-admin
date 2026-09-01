import type { InjectionKey } from "vue";
import type { InAdminAppOptions } from "./plugin";

export const adminAppOptionsKey: InjectionKey<Readonly<InAdminAppOptions>> = Symbol(
  "ingot-admin-app-options",
);
