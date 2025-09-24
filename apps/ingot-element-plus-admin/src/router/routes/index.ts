import type { RouteRecordRaw } from "vue-router";
import { securityRoutes } from "./security";
import { commonRoutes } from "./common";

const routes: Array<RouteRecordRaw> = [...commonRoutes, ...securityRoutes];

export default routes;
