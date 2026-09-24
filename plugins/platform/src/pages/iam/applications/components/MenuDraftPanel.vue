<template>
  <div class="flex flex-col h-full min-h-0">
    <in-table
      :data="filteredMenus"
      :headers="menuHeaders"
      density="compact"
      tree-column="name"
      :row-key="menuKeyOf"
    >
      <template #tools-start>
        <el-input
          v-model="menuFilter.name"
          class="w-200px!"
          clearable
          placeholder="搜索菜单名"
          :prefix-icon="Search"
        />
        <in-filter-panel :active-count="menuExtraFilterCount">
          <in-picker v-model="kindFilter" label="类型" :options="kindOptions" />
          <in-picker v-model="matchFilter" label="匹配" :options="matchOptions" />
          <in-picker v-model="accessFilter" label="准入" :options="accessOptions" />
          <template #footer>
            <in-button @click="privateOnResetExtra">重置</in-button>
          </template>
        </in-filter-panel>
      </template>
      <template #tools-end>
        <in-button @in-click="privateCreateMenu">创建菜单</in-button>
      </template>
      <template #name="{ item }">
        <span class="inline-flex items-center gap-8px min-w-0">
          <catalog-icon-preview :value="asMenu(item).record.icon" />
          <span class="truncate">{{ asMenu(item).record.name }}</span>
        </span>
      </template>
      <template #path="{ item }">
        {{ asMenu(item).record.path || asMenu(item).record.viewPath || "-" }}
      </template>
      <template #actions="{ item }">
        <in-button text link @click="privateOpenMenu(asMenu(item))">详情</in-button>
        <in-button text link type="danger" @click="privateDeleteMenu(asMenu(item))">删除</in-button>
      </template>
    </in-table>
  </div>

  <menu-edit-drawer
    ref="menuRef"
    :resolve-catalog="resolveCatalog"
    :submit="privateSubmitMenu"
  />
</template>

<script setup lang="ts">
import { Search } from "@element-plus/icons-vue";
import { Confirm, resolveStringPickerFilter, toStringPickerValue, withAllPickerOption } from "@ingot/admin-core";
import {
  filterMenuTree,
  useMenuAccessModeEnum,
  useMenuKindEnum,
  useMenuMatchModeEnum,
  type AppMenuDraft,
  type MenuTreeRow,
} from "@ingot/admin-common";
import {
  catalogActionsOf,
  menusToTree,
  upsertDraftMenu,
  type AppWizardProfile,
  type DraftMenu,
  type DraftResource,
} from "../createWizard";
import type { ActionCatalog } from "../menuActions";
import { menuHeaders } from "../table";
import CatalogIconPreview from "./CatalogIconPreview.vue";
import MenuEditDrawer from "./MenuEditDrawer.vue";

defineOptions({ name: "MenuDraftPanel" });

const props = defineProps<{
  profile: AppWizardProfile;
}>();

const resources = defineModel<DraftResource[]>("resources", { default: () => [] });
const menus = defineModel<DraftMenu[]>("menus", { default: () => [] });
const menuRef = ref<{
  show: (appId: string, menuList: MenuTreeRow[], target?: MenuTreeRow, applicationName?: string) => void;
}>();
const menuFilter = reactive({
  name: "",
  kind: undefined as string | undefined,
  matchMode: undefined as string | undefined,
  accessMode: undefined as string | undefined,
});
const kindEnum = useMenuKindEnum();
const matchEnum = useMenuMatchModeEnum();
const accessEnum = useMenuAccessModeEnum();
const kindOptions = computed(() => withAllPickerOption(kindEnum.getOptions()));
const matchOptions = computed(() => withAllPickerOption(matchEnum.getOptions()));
const accessOptions = computed(() => withAllPickerOption(accessEnum.getOptions()));
const kindFilter = computed({
  get: () => toStringPickerValue(menuFilter.kind),
  set: (value: string | number | boolean | null) => {
    menuFilter.kind = resolveStringPickerFilter(value);
  },
});
const matchFilter = computed({
  get: () => toStringPickerValue(menuFilter.matchMode),
  set: (value: string | number | boolean | null) => {
    menuFilter.matchMode = resolveStringPickerFilter(value);
  },
});
const accessFilter = computed({
  get: () => toStringPickerValue(menuFilter.accessMode),
  set: (value: string | number | boolean | null) => {
    menuFilter.accessMode = resolveStringPickerFilter(value);
  },
});
const menuExtraFilterCount = computed(() => {
  let count = 0;
  if (menuFilter.kind) {
    count += 1;
  }
  if (menuFilter.matchMode) {
    count += 1;
  }
  if (menuFilter.accessMode) {
    count += 1;
  }
  return count;
});
const menuTree = computed(() => menusToTree(menus.value));
const filteredMenus = computed(() => filterMenuTree(menuTree.value, menuFilter));
const menuKeyOf = (row: MenuTreeRow): string => row.record.id;
const asMenu = (row: unknown): MenuTreeRow => row as MenuTreeRow;

const resolveCatalog = (): Promise<ActionCatalog> =>
  Promise.resolve({
    applicationId: "draft-application",
    applicationName: props.profile.name || props.profile.code || "当前应用",
    resources: resources.value.map((resource) => ({
      id: resource.tempId,
      name: resource.name || resource.code,
      code: resource.code,
      actions: catalogActionsOf(props.profile, [resource]),
    })),
  });

const privateOnResetExtra = (): void => {
  menuFilter.kind = undefined;
  menuFilter.matchMode = undefined;
  menuFilter.accessMode = undefined;
};

const privateCreateMenu = (): void => {
  menuRef.value?.show("draft", menuTree.value, undefined, props.profile.name);
};

const privateOpenMenu = (row: MenuTreeRow): void => {
  menuRef.value?.show("draft", menuTree.value, row, props.profile.name);
};

const privateSubmitMenu = (draft: AppMenuDraft, target?: MenuTreeRow): void => {
  menus.value = upsertDraftMenu(menus.value, draft, target?.record.id);
};

const privateDeleteMenu = (row: MenuTreeRow): void => {
  Confirm.warning(`是否删除菜单（${row.record.name}）？`).then(() => {
    menus.value = menus.value
      .filter((item) => item.tempId !== row.record.id)
      .map((item) => (item.parentTempId === row.record.id ? { ...item, parentTempId: undefined } : item));
  });
};
</script>
