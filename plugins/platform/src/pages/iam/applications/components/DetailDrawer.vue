<template>
  <in-detail-drawer
    v-model="visible"
    v-model:tab="tab"
    v-model:editing="editing"
    title="应用详情"
    :loading="loading"
    :saving="session.saving.value"
    size="720px"
    @edit="session.enterEdit"
    @cancel="privateCancel"
    @save="privateSave"
  >
    <in-biz-tab-panel title="基本信息" name="base">
      <in-form v-if="detail" :editing="editing">
        <in-detail-field label="编码">
          <template #view>
            <in-copy-tag :text="detail.record.code" />
          </template>
        </in-detail-field>
        <in-detail-field label="名称" :value="detail.record.name">
          <el-input v-model="draft.name" />
        </in-detail-field>
        <in-detail-field label="说明" :value="detail.record.description">
          <el-input v-model="draft.description" type="textarea" :rows="3" />
        </in-detail-field>
        <in-detail-field label="排序" :value="detail.record.sortOrder">
          <el-input-number v-model="draft.sortOrder" :min="0" />
        </in-detail-field>
        <in-detail-field label="基础应用" :value="detail.record.baseline ? '是' : '否'">
          <el-switch v-model="draft.baseline" />
        </in-detail-field>
        <in-detail-field label="状态">
          <template #view>
            <biz-iam-status-tag :status="detail.record.status" />
          </template>
        </in-detail-field>
      </in-form>
    </in-biz-tab-panel>
    <in-biz-tab-panel title="资源与操作" name="catalog" :editable="false" fill>
      <div class="embedded-table">
        <in-table
          :loading="resourceLoading"
          :data="resourcePage.records"
          :page="resourcePage"
          :headers="resourceHeaders"
          density="compact"
          :row-key="resourceKeyOf"
          @handleSizeChange="privateOnResourceSizeChange"
          @handleCurrentChange="privateOnResourceCurrentChange"
        >
          <template #tools-start>
            <el-input
              v-model="resourceFilter.name"
              class="w-200px!"
              clearable
              placeholder="搜索资源名"
              :prefix-icon="Search"
              @keyup.enter="privateOnResourceSearch"
              @clear="privateOnResourceSearch"
            />
            <el-input
              v-model="resourceFilter.code"
              class="w-200px!"
              clearable
              placeholder="搜索资源编码"
              :prefix-icon="Search"
              @keyup.enter="privateOnResourceSearch"
              @clear="privateOnResourceSearch"
            />
          </template>
        <template #tools-end>
          <in-button v-auth="IamAction.PLATFORM_RESOURCE_CREATE" @click="privateCreateResource">
            创建资源
          </in-button>
        </template>
        <template #name="{ item }">{{ asResource(item).record.name }}</template>
        <template #code="{ item }">
          <in-copy-tag :text="asResource(item).record.code" />
        </template>
        <template #scope="{ item }">
          {{ formatScopeKinds(asResource(item).record.scopeCapabilities) }}
        </template>
        <template #actions="{ item }">
          <in-button text link @click="privateOpenActions(asResource(item))">操作</in-button>
          <in-button text link @click="privateEditResource(asResource(item))">编辑</in-button>
          <in-button text link @click="privateDeleteResource(asResource(item))">删除</in-button>
        </template>
        </in-table>
      </div>
    </in-biz-tab-panel>
    <in-biz-tab-panel title="菜单" name="menus" :editable="false" fill>
      <div class="embedded-table">
        <in-table
          :loading="menuLoading"
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
                <in-button @click="privateOnResetMenuExtra">重置</in-button>
              </template>
            </in-filter-panel>
          </template>
          <template #tools-end>
            <in-button v-auth="IamAction.PLATFORM_MENU_CREATE" @click="privateCreateMenu">
              创建菜单
            </in-button>
          </template>
          <template #name="{ item }">{{ asMenu(item).record.name }}</template>
          <template #path="{ item }">
            {{ asMenu(item).record.path || asMenu(item).record.viewPath || "—" }}
          </template>
          <template #actions="{ item }">
            <in-button text link @click="privateOpenMenu(asMenu(item))">详情</in-button>
            <in-button text link @click="privateDeleteMenu(asMenu(item))">删除</in-button>
          </template>
        </in-table>
      </div>
    </in-biz-tab-panel>
  </in-detail-drawer>

  <ResourceEditDrawer ref="resourceRef" @success="loadResources" />
  <ActionListDialog ref="actionListRef" />
  <MenuEditDrawer ref="menuRef" @success="loadMenus" />
</template>

<script setup lang="ts">
import { Search } from "@element-plus/icons-vue";
import {
  Confirm,
  Message,
  createLoadGuard,
  resolveStringPickerFilter,
  toStringPickerValue,
  useDetailEditSession,
  withAllPickerOption,
  type Page,
} from "@ingot/admin-core";
import {
  BizIamStatusTag,
  IAM_DEFAULT_PAGE_SIZE,
  IamAction,
  filterMenuTree,
  formatScopeKinds,
  useMenuAccessModeEnum,
  useMenuKindEnum,
  useMenuMatchModeEnum,
  type AppResourceRecord,
  type ApplicationRecord,
  type MenuTreeRow,
  type ResourceDetail,
} from "@ingot/admin-common";
import {
  PlatformApplicationDetailAPI,
  PlatformApplicationUpdateAPI,
  PlatformMenuDeleteAPI,
  PlatformMenuTreeAPI,
  PlatformResourceDeleteAPI,
  PlatformResourcePageAPI,
} from "@/api/iam/catalog";
import { platformApplicationQueryKeys } from "@/api/iam/catalog.query";
import { useQueryClient } from "@tanstack/vue-query";
import { menuHeaders, resourceHeaders, type Row } from "../table";
import ResourceEditDrawer from "./ResourceEditDrawer.vue";
import ActionListDialog from "./ActionListDialog.vue";
import MenuEditDrawer from "./MenuEditDrawer.vue";

defineOptions({ name: "ApplicationDetailDrawer" });

const emits = defineEmits<{ success: [] }>();
const queryClient = useQueryClient();
const session = useDetailEditSession();
const { editing } = session;
const visible = ref(false);
const tab = ref("base");
const loading = ref(false);
const resourceLoading = ref(false);
const menuLoading = ref(false);
const detail = ref<ResourceDetail<ApplicationRecord>>();
const resourcePage = ref<Page<ResourceDetail<AppResourceRecord>>>({
  current: 1,
  size: IAM_DEFAULT_PAGE_SIZE,
  total: 0,
  records: [],
});
const menus = ref<MenuTreeRow[]>([]);
const resourceFilter = reactive({
  name: "",
  code: "",
});
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
const filteredMenus = computed(() => filterMenuTree(menus.value, menuFilter));
const resourceRef = ref<{ show: (appId: string, target?: ResourceDetail<AppResourceRecord>) => void }>();
const actionListRef = ref<{ show: (appId: string, target: ResourceDetail<AppResourceRecord>) => void }>();
const menuRef = ref<{
  show: (appId: string, menuList: MenuTreeRow[], target?: MenuTreeRow) => void;
}>();
const draft = reactive({
  name: "",
  description: "",
  sortOrder: 0,
  baseline: false,
});
const loadGuard = createLoadGuard();

const resourceKeyOf = (row: ResourceDetail<AppResourceRecord>): string => row.record.id;
const menuKeyOf = (row: MenuTreeRow): string => row.record.id;

const asResource = (row: unknown): ResourceDetail<AppResourceRecord> =>
  row as ResourceDetail<AppResourceRecord>;
const asMenu = (row: unknown): MenuTreeRow => row as MenuTreeRow;

const applyDraft = (record: ApplicationRecord): void => {
  draft.name = record.name;
  draft.description = record.description ?? "";
  draft.sortOrder = record.sortOrder;
  draft.baseline = record.baseline;
};

const loadResources = (requestId?: string): void => {
  const id = requestId ?? detail.value?.record.id;
  if (!id) {
    return;
  }
  resourceLoading.value = true;
  PlatformResourcePageAPI(
    id,
    {
      current: resourcePage.value.current,
      size: resourcePage.value.size,
    },
    {
      name: resourceFilter.name.trim() || undefined,
      code: resourceFilter.code.trim() || undefined,
    },
  )
    .then((response) => {
      if (detail.value?.record.id !== id) {
        return;
      }
      resourcePage.value = response.data;
    })
    .finally(() => {
      if (detail.value?.record.id === id) {
        resourceLoading.value = false;
      }
    });
};

const loadMenus = (requestId?: string): void => {
  const id = requestId ?? detail.value?.record.id;
  if (!id) {
    return;
  }
  menuLoading.value = true;
  PlatformMenuTreeAPI(id)
    .then((response) => {
      if (detail.value?.record.id !== id) {
        return;
      }
      menus.value = response.data ?? [];
    })
    .finally(() => {
      if (detail.value?.record.id === id) {
        menuLoading.value = false;
      }
    });
};

const privateOnResourceSearch = (): void => {
  resourcePage.value.current = 1;
  loadResources();
};

const privateOnResourceSizeChange = (payload: { value: number }): void => {
  resourcePage.value.size = payload.value;
  resourcePage.value.current = 1;
  loadResources();
};

const privateOnResourceCurrentChange = (payload: { value: number }): void => {
  resourcePage.value.current = payload.value;
  loadResources();
};

const load = (id: string): void => {
  const guard = loadGuard.begin();
  loading.value = true;
  detail.value = undefined;
  resourcePage.value = {
    current: 1,
    size: IAM_DEFAULT_PAGE_SIZE,
    total: 0,
    records: [],
  };
  menus.value = [];
  resourceFilter.name = "";
  resourceFilter.code = "";
  menuFilter.name = "";
  menuFilter.kind = undefined;
  menuFilter.matchMode = undefined;
  menuFilter.accessMode = undefined;
  draft.name = "";
  draft.description = "";
  draft.sortOrder = 0;
  draft.baseline = false;
  PlatformApplicationDetailAPI(id)
    .then((response) => {
      if (!guard.isCurrent()) {
        return;
      }
      detail.value = response.data;
      applyDraft(response.data.record);
      loadResources(id);
      loadMenus(id);
    })
    .finally(() => {
      if (guard.isCurrent()) {
        loading.value = false;
      }
    });
};

const privateCancel = (): void => {
  session.exitEdit();
  if (detail.value) {
    applyDraft(detail.value.record);
  }
};

const privateSave = (): void => {
  if (!detail.value) {
    return;
  }
  session.saving.value = true;
  PlatformApplicationUpdateAPI(detail.value.record.id, {
    expectedVersion: detail.value.version,
    name: draft.name.trim(),
    description: draft.description.trim() || undefined,
    sortOrder: draft.sortOrder,
    baseline: draft.baseline,
  })
    .then((response) => {
      detail.value = response.data;
      applyDraft(response.data.record);
      Message.success("保存成功");
      session.exitEdit();
      visible.value = false;
      void queryClient.invalidateQueries({ queryKey: platformApplicationQueryKeys.lists() });
      emits("success");
    })
    .finally(() => {
      session.saving.value = false;
    });
};

const requireAppId = (): string | undefined => detail.value?.record.id;

const privateCreateResource = (): void => {
  const id = requireAppId();
  if (id) {
    resourceRef.value?.show(id);
  }
};

const privateEditResource = (row: ResourceDetail<AppResourceRecord>): void => {
  const id = requireAppId();
  if (id) {
    resourceRef.value?.show(id, row);
  }
};

const privateDeleteResource = (row: ResourceDetail<AppResourceRecord>): void => {
  const id = requireAppId();
  if (!id) {
    return;
  }
  Confirm.warning(`删除资源会阻止仍引用它的操作。是否删除（${row.record.name}）？`).then(() => {
    PlatformResourceDeleteAPI(id, row.record.id).then(() => {
      Message.success("已删除");
      loadResources();
    });
  });
};

const privateOpenActions = (row: ResourceDetail<AppResourceRecord>): void => {
  const id = requireAppId();
  if (id) {
    actionListRef.value?.show(id, row);
  }
};

const privateOnResetMenuExtra = (): void => {
  menuFilter.kind = undefined;
  menuFilter.matchMode = undefined;
  menuFilter.accessMode = undefined;
};

const privateCreateMenu = (): void => {
  const id = requireAppId();
  if (id) {
    menuRef.value?.show(id, menus.value);
  }
};

const privateOpenMenu = (row: MenuTreeRow): void => {
  const id = requireAppId();
  if (id) {
    menuRef.value?.show(id, menus.value, row);
  }
};

const privateDeleteMenu = (row: MenuTreeRow): void => {
  const id = requireAppId();
  if (!id) {
    return;
  }
  Confirm.warning(`是否删除菜单（${row.record.name}）？`).then(() => {
    PlatformMenuDeleteAPI(id, row.record.id).then(() => {
      Message.success("已删除");
      loadMenus();
    });
  });
};

defineExpose({
  show(row: Row) {
    visible.value = true;
    tab.value = "base";
    session.exitEdit();
    load(row.record.id);
  },
});
</script>

<style lang="postcss" scoped>
.embedded-table {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.embedded-table :deep(.in-table) {
  flex: 1;
  min-height: 0;
  padding: 0;
}
</style>
