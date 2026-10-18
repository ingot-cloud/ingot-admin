// 浏览器夹具使用真实组件与真实隔离IAM接口；身份只由测试HTTP过滤器恢复。
import { createApp, h, ref } from "vue";
import { createRouter, createMemoryHistory } from "vue-router";
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import "../../packages/admin-core/dist/style.css";
import "../../packages/admin-common/dist/style.css";
import {
  adminCorePlugin,
  usePermissions,
  Http,
  refreshSessionPermissions,
} from "@ingot/admin-core";
import {
  BizIamCurrentRoleDrawer,
  BizIamTenantAssignmentDrawer,
  createCurrentRoleApis,
} from "@ingot/admin-common";
const query = new URLSearchParams(location.search);
const shared = query.get("shared") === "true";
const request = async (path, method = "GET", body) => {
  const response = await fetch(`/api/iam${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(`${response.status}: ${result.msg || result.message}`);
  return result;
};
const bootstrap = await request("/v1/me/bootstrap");
const pinia = createPinia();
const roles = ref(),
  assignments = ref(),
  saved = ref(0),
  status = ref("");
const Root = {
  setup() {
    const permissions = usePermissions();
    permissions.applyContext(bootstrap.data);
    permissions.applyCapabilities(bootstrap.data);
    return () =>
      h("main", { style: "padding:24px" }, [
        h("h1", "IAM 实时授权验收"),
        h("p", { "data-testid": "owner" }, permissions.tenantOwner ? "组织拥有者" : "组织成员"),
        h("button", { "data-testid": "new-role", onClick: () => roles.value.show() }, "创建角色"),
        h(
          "button",
          { "data-testid": "open-role", onClick: () => roles.value.show(query.get("role") || "") },
          "角色详情",
        ),
        h(
          "button",
          { "data-testid": "new-assignment", onClick: () => assignments.value.show() },
          "分配角色",
        ),
        h(
          "button",
          {
            "data-testid": "refresh",
            onClick: async () => {
              await refreshSessionPermissions({ refreshMenusIfVersionChanged: true });
              status.value = permissions.permissions.join(",");
            },
          },
          "刷新当前权限",
        ),
        h("div", { "data-testid": "actions" }, status.value || permissions.permissions.join(",")),
        h("p", { "data-testid": "saved" }, String(saved.value)),
        h(BizIamCurrentRoleDrawer, {
          ref: roles,
          shared,
          apis: createCurrentRoleApis(shared ? "shared" : "tenant"),
          applicationCandidates: async (q) =>
            shared
              ? request(`/fixture/applications?page=${q.page || 1}&pageSize=${q.pageSize || 20}`)
              : request(
                  `/v1/tenant/assignments/options?kind=APPLICATION&page=${q.page || 1}&pageSize=${q.pageSize || 20}`,
                ),
          catalogAPI: async (applicationId, page, keyword) => {
            const result = await request(
              `${shared ? "/fixture/catalog" : "/v1/tenant/roles/grant-catalog"}?applicationId=${applicationId}&page=${page.current || 1}&pageSize=${page.size || 20}&keyword=${encodeURIComponent(keyword || "")}`,
            );
            return { ...result, data: { records: result.data.items, total: result.data.total } };
          },
          onSuccess: () => saved.value++,
        }),
        h(BizIamTenantAssignmentDrawer, {
          ref: assignments,
          apis: {
            optionsAPI: (q) =>
              request(
                `/v1/tenant/assignments/options?${new URLSearchParams(Object.entries(q).filter(([, v]) => v !== undefined))}`,
              ),
            roleAPI: (id, source) =>
              request(
                `/v1/tenant/assignments/roles/${id}${source ? `?delegationGrantId=${source}` : ""}`,
              ),
            mineAPI: () => request("/v1/tenant/delegations/mine"),
            scopeAPI: (q) =>
              request(`/v1/tenant/assignments/scope-candidates?${new URLSearchParams(q)}`),
            createAPI: (body) => request("/v1/tenant/assignments", "POST", body),
            previewAPI: (body) => request("/v1/tenant/assignments/preview", "POST", body),
            updateAPI: (id, body) => request(`/v1/tenant/assignments/${id}`, "PUT", body),
          },
          onSuccess: () => saved.value++,
        }),
      ]);
  },
};
const app = createApp(Root);
adminCorePlugin.install({
  appCode: "tenant-live-fixture",
  app,
  pinia,
  router: createRouter({ history: createMemoryHistory(), routes: [] }),
  resolvePage: () => async () => Root,
  listViews: () => [],
});
app.use(pinia);
app.use(ElementPlus);
Object.entries(adminCorePlugin.components).forEach(([name, component]) =>
  app.component(name, component),
);
Http.configure({ timeout: 10000 });
app.mount("#app");
