import { App } from "vue";
import IngotAppBar from "./Layout/IngotAppBar.vue";
import IngotSidebarMenu from "./Layout/sidebar/IngotSidebarMenu.vue";
import IngotSidebarItem from "./Layout/sidebar/IngotSidebarItem.vue";
import IngotIcon from "./Icon/index.vue";
import IngotContainer from "./Container/index.vue";
import IngotPageCard from "./PageCard/index.vue";
import IngotTable from "./Table/index.vue";
import IngotFilterContainer from "./FilterContainer/index.vue";
import TenantOptions from "./TenantOptions/index.vue";
import Select from "./Select/index.vue";
import IconSelect from "./IconSelect/index.vue";
import CommonStatusTag from "./biz/CommonStatusTag.vue";
import CommonStatusButton from "./biz/CommonStatusButton.vue";

/**
 * 注册组件
 * @param app App
 */
export function registerComponent(app: App): void {
  app.component("ingot-container", IngotContainer);
  app.component("ingot-app-bar", IngotAppBar);
  app.component("ingot-sidebar-menu", IngotSidebarMenu);
  app.component("ingot-sidebar-item", IngotSidebarItem);
  app.component("ingot-icon", IngotIcon);
  app.component("ingot-icon-select", IconSelect);
  app.component("ingot-page-card", IngotPageCard);
  app.component("ingot-table", IngotTable);
  app.component("ingot-filter-container", IngotFilterContainer);
  app.component("ingot-tenant-options", TenantOptions);
  app.component("ingot-select", Select);

  registerBizComponent(app);
}

function registerBizComponent(app: App): void {
  app.component("ingot-common-status-tag", CommonStatusTag);
  app.component("ingot-common-status-button", CommonStatusButton);
}
