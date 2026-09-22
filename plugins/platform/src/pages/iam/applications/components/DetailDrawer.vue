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
        <in-detail-field label="编码" :value="detail.record.code" />
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
    <in-biz-tab-panel title="资源与操作" name="catalog" :editable="false">
      <div class="flex flex-col gap-16px">
        <div class="flex items-center justify-between">
          <span class="font-500">资源</span>
          <in-button v-auth="IamAction.PLATFORM_RESOURCE_CREATE" @click="privateCreateResource">
            创建资源
          </in-button>
        </div>
        <el-table
          :data="resources"
          :row-key="resourceKeyOf"
          highlight-current-row
          @current-change="privateSelectResource"
        >
          <el-table-column label="名称" min-width="140">
            <template #default="{ row }">{{ row.record.name }}</template>
          </el-table-column>
          <el-table-column label="编码" min-width="120">
            <template #default="{ row }">{{ row.record.code }}</template>
          </el-table-column>
          <el-table-column label="范围" min-width="160">
            <template #default="{ row }">{{ formatScopeKinds(row.record.scopeCapabilities) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="140">
            <template #default="{ row }">
              <in-button text link @click="privateEditResource(asResource(row))">编辑</in-button>
              <in-button text link @click="privateDeleteResource(asResource(row))">删除</in-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="flex items-center justify-between">
          <span class="font-500">操作{{ selectedResource ? ` · ${selectedResource.record.name}` : "" }}</span>
          <in-button v-auth="IamAction.PLATFORM_ACTION_CREATE" @click="privateCreateAction">创建操作</in-button>
        </div>
        <el-table :data="visibleActions" :row-key="actionKeyOf">
          <el-table-column label="名称" min-width="140">
            <template #default="{ row }">{{ row.record.name }}</template>
          </el-table-column>
          <el-table-column label="操作码" min-width="200">
            <template #default="{ row }">{{ row.record.code }}</template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <biz-iam-status-tag :status="row.record.status" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180">
            <template #default="{ row }">
              <in-button text link @click="privateEditAction(asAction(row))">编辑</in-button>
              <in-button text link @click="privateToggleAction(asAction(row))">
                {{ asAction(row).record.status === ConfigurationStatus.ENABLED ? "停用" : "启用" }}
              </in-button>
              <in-button text link @click="privateDeleteAction(asAction(row))">删除</in-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </in-biz-tab-panel>
    <in-biz-tab-panel title="菜单" name="menus" :editable="false">
      <div class="flex flex-col gap-12px">
        <div class="flex justify-end">
          <in-button v-auth="IamAction.PLATFORM_MENU_CREATE" @click="privateCreateMenu">创建菜单</in-button>
        </div>
        <el-table :data="menus" :row-key="menuKeyOf">
          <el-table-column label="名称" min-width="140">
            <template #default="{ row }">{{ row.record.name }}</template>
          </el-table-column>
          <el-table-column label="类型" width="90">
            <template #default="{ row }">{{ row.record.kind }}</template>
          </el-table-column>
          <el-table-column label="匹配" width="90">
            <template #default="{ row }">{{ row.record.matchMode }}</template>
          </el-table-column>
          <el-table-column label="路径" min-width="160">
            <template #default="{ row }">{{ row.record.path || row.record.viewPath || "—" }}</template>
          </el-table-column>
          <el-table-column label="操作" width="140">
            <template #default="{ row }">
              <in-button text link @click="privateEditMenu(asMenu(row))">编辑</in-button>
              <in-button text link @click="privateDeleteMenu(asMenu(row))">删除</in-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </in-biz-tab-panel>
  </in-detail-drawer>

  <ResourceEditDrawer ref="resourceRef" @success="loadCatalog" />
  <ActionEditDrawer ref="actionRef" @success="loadCatalog" />
  <MenuEditDrawer ref="menuRef" @success="loadCatalog" />
</template>

<script setup lang="ts">
import { Confirm, Message, createLoadGuard, useDetailEditSession } from "@ingot/admin-core";
import {
  BizIamStatusTag,
  ConfigurationStatus,
  IamAction,
  formatScopeKinds,
  type AppActionRecord,
  type AppMenuRecord,
  type AppResourceRecord,
  type ApplicationRecord,
  type ResourceDetail,
} from "@ingot/admin-common";
import {
  PlatformActionDeleteAPI,
  PlatformActionPageAPI,
  PlatformActionStatusAPI,
  PlatformApplicationDetailAPI,
  PlatformApplicationUpdateAPI,
  PlatformMenuDeleteAPI,
  PlatformMenuPageAPI,
  PlatformResourceDeleteAPI,
  PlatformResourcePageAPI,
} from "@/api/iam/catalog";
import { platformApplicationQueryKeys } from "@/api/iam/catalog.query";
import { useQueryClient } from "@tanstack/vue-query";
import type { Row } from "../table";
import ResourceEditDrawer from "./ResourceEditDrawer.vue";
import ActionEditDrawer from "./ActionEditDrawer.vue";
import MenuEditDrawer from "./MenuEditDrawer.vue";

defineOptions({ name: "ApplicationDetailDrawer" });

const emits = defineEmits<{ success: [] }>();
const queryClient = useQueryClient();
const session = useDetailEditSession();
const { editing } = session;
const visible = ref(false);
const tab = ref("base");
const loading = ref(false);
const detail = ref<ResourceDetail<ApplicationRecord>>();
const resources = ref<Array<ResourceDetail<AppResourceRecord>>>([]);
const actions = ref<Array<ResourceDetail<AppActionRecord>>>([]);
const menus = ref<Array<ResourceDetail<AppMenuRecord>>>([]);
const selectedResource = ref<ResourceDetail<AppResourceRecord>>();
const resourceRef = ref<{ show: (appId: string, target?: ResourceDetail<AppResourceRecord>) => void }>();
const actionRef = ref<{
  show: (
    appId: string,
    resourceList: Array<ResourceDetail<AppResourceRecord>>,
    target?: ResourceDetail<AppActionRecord>,
    preferredResourceId?: string,
  ) => void;
}>();
const menuRef = ref<{
  show: (
    appId: string,
    actionList: Array<ResourceDetail<AppActionRecord>>,
    menuList: Array<ResourceDetail<AppMenuRecord>>,
    target?: ResourceDetail<AppMenuRecord>,
  ) => void;
}>();
const draft = reactive({
  name: "",
  description: "",
  sortOrder: 0,
  baseline: false,
});
const loadGuard = createLoadGuard();

const visibleActions = computed(() => {
  if (!selectedResource.value) {
    return actions.value;
  }
  return actions.value.filter((item) => item.record.resourceId === selectedResource.value?.record.id);
});

const resourceKeyOf = (row: ResourceDetail<AppResourceRecord>): string => row.record.id;
const actionKeyOf = (row: ResourceDetail<AppActionRecord>): string => row.record.id;
const menuKeyOf = (row: ResourceDetail<AppMenuRecord>): string => row.record.id;

const asResource = (row: unknown): ResourceDetail<AppResourceRecord> =>
  row as ResourceDetail<AppResourceRecord>;
const asAction = (row: unknown): ResourceDetail<AppActionRecord> =>
  row as ResourceDetail<AppActionRecord>;
const asMenu = (row: unknown): ResourceDetail<AppMenuRecord> => row as ResourceDetail<AppMenuRecord>;

const applyDraft = (record: ApplicationRecord): void => {
  draft.name = record.name;
  draft.description = record.description ?? "";
  draft.sortOrder = record.sortOrder;
  draft.baseline = record.baseline;
};

const loadCatalog = (requestId?: string): void => {
  const id = requestId ?? detail.value?.record.id;
  if (!id) {
    return;
  }
  Promise.all([PlatformResourcePageAPI(id), PlatformActionPageAPI(id), PlatformMenuPageAPI(id)]).then(
    ([resourceRes, actionRes, menuRes]) => {
      if (detail.value?.record.id !== id) {
        return;
      }
      resources.value = resourceRes.data.records ?? [];
      actions.value = actionRes.data.records ?? [];
      menus.value = menuRes.data.records ?? [];
      if (selectedResource.value) {
        selectedResource.value =
          resources.value.find((item) => item.record.id === selectedResource.value?.record.id) ??
          resources.value[0];
      } else {
        selectedResource.value = resources.value[0];
      }
    },
  );
};

const load = (id: string): void => {
  const guard = loadGuard.begin();
  loading.value = true;
  detail.value = undefined;
  resources.value = [];
  actions.value = [];
  menus.value = [];
  selectedResource.value = undefined;
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
      loadCatalog(id);
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

const privateSelectResource = (row: unknown): void => {
  selectedResource.value = row ? asResource(row) : undefined;
};

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
      loadCatalog();
    });
  });
};

const privateCreateAction = (): void => {
  const id = requireAppId();
  if (id) {
    actionRef.value?.show(id, resources.value, undefined, selectedResource.value?.record.id);
  }
};

const privateEditAction = (row: ResourceDetail<AppActionRecord>): void => {
  const id = requireAppId();
  if (id) {
    actionRef.value?.show(id, resources.value, row);
  }
};

const privateToggleAction = (row: ResourceDetail<AppActionRecord>): void => {
  const id = requireAppId();
  if (!id) {
    return;
  }
  const next =
    row.record.status === ConfigurationStatus.ENABLED
      ? ConfigurationStatus.DISABLED
      : ConfigurationStatus.ENABLED;
  PlatformActionStatusAPI(id, row.record.id, {
    expectedVersion: row.version,
    status: next,
  }).then(() => {
    Message.success(next === ConfigurationStatus.ENABLED ? "已启用" : "已停用");
    loadCatalog();
  });
};

const privateDeleteAction = (row: ResourceDetail<AppActionRecord>): void => {
  const id = requireAppId();
  if (!id) {
    return;
  }
  Confirm.warning(`是否删除操作（${row.record.code}）？`).then(() => {
    PlatformActionDeleteAPI(id, row.record.id).then(() => {
      Message.success("已删除");
      loadCatalog();
    });
  });
};

const privateCreateMenu = (): void => {
  const id = requireAppId();
  if (id) {
    menuRef.value?.show(id, actions.value, menus.value);
  }
};

const privateEditMenu = (row: ResourceDetail<AppMenuRecord>): void => {
  const id = requireAppId();
  if (id) {
    menuRef.value?.show(id, actions.value, menus.value, row);
  }
};

const privateDeleteMenu = (row: ResourceDetail<AppMenuRecord>): void => {
  const id = requireAppId();
  if (!id) {
    return;
  }
  Confirm.warning(`是否删除菜单（${row.record.name}）？`).then(() => {
    PlatformMenuDeleteAPI(id, row.record.id).then(() => {
      Message.success("已删除");
      loadCatalog();
    });
  });
};

defineExpose({
  show(row: Row) {
    visible.value = true;
    tab.value = "base";
    session.exitEdit();
    selectedResource.value = undefined;
    load(row.record.id);
  },
});
</script>
