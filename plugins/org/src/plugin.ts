import type { Component } from "vue";
import {
  definePluginPages,
  defineStaticMenus,
  INGOT_ADMIN_PLUGIN_API_VERSION,
  MenuType,
  PageLayoutViewPath,
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
  staticMenus: defineStaticMenus([
    {
      name: "批量导入或导出成员",
      path: "/org/iam/members/workbook-root",
      routeName: "org.iam.members.workbook.root",
      menuType: MenuType.Directory,
      viewPath: PageLayoutViewPath.MAIN,
      hidden: true,
      children: [
        {
          name: "批量导入或导出成员",
          path: "/org/iam/members/workbook",
          routeName: "org.iam.members.workbook",
          menuType: MenuType.Menu,
          viewPath: "org.iam.members.workbook",
          hidden: true,
        },
      ],
    },
    {
      name: "批量导入或导出部门",
      path: "/org/iam/departments/workbook-root",
      routeName: "org.iam.departments.workbook.root",
      menuType: MenuType.Directory,
      viewPath: PageLayoutViewPath.MAIN,
      hidden: true,
      children: [
        {
          name: "批量导入或导出部门",
          path: "/org/iam/departments/workbook",
          routeName: "org.iam.departments.workbook",
          menuType: MenuType.Menu,
          viewPath: "org.iam.departments.workbook",
          hidden: true,
        },
      ],
    },
  ]),
  components: domainGlobalComponents,
  install({ app }) {
    app.provide(organizationMemberPickerKey, {
      browse: async (params) => (await TenantOrganizationMemberBrowseAPI(params)).data,
      loadDepartments: async (parentId, page) =>
        (await TenantDepartmentNavigationAPI(parentId, page)).data,
    });
  },
};
