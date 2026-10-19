import type { Component } from "vue";
import {
  definePluginPages,
  INGOT_ADMIN_PLUGIN_API_VERSION,
  type InAdminPlugin,
} from "@ingot/admin-core";
import { domainGlobalComponents } from "./components/global";

import { organizationMemberPickerKey } from "@ingot/admin-common";
import {
  TenantDepartmentNavigationAPI,
  TenantOrganizationMemberBrowseAPI,
} from "./api/iam/directory";

interface InPageModule {
  default: Component;
}

const modules = import.meta.glob<InPageModule>("./pages/**/*.vue");

export const orgPlugin: InAdminPlugin = {
  id: "ingot-org",
  apiVersion: INGOT_ADMIN_PLUGIN_API_VERSION,
  dependsOn: ["ingot-admin-core"],
  pages: definePluginPages({
    modules,
    sourceRoot: "./pages",
    canonicalPrefix: "org",
  }),
  components: domainGlobalComponents,
  install({ app }) {
    app.provide(organizationMemberPickerKey, {
      browse: async (params) => (await TenantOrganizationMemberBrowseAPI(params)).data,
      loadDepartments: async (parentId, page) =>
        (await TenantDepartmentNavigationAPI(parentId, page)).data,
    });
  },
};
