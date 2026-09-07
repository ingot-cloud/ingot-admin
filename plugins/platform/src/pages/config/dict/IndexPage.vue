<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="按作用域维护字典类型与字典项。" />
    </template>

    <in-split-layout left-collapsible :persistence-key="DICT_SPLIT_KEY">
      <template #top>
        <in-filter-item>
          <in-with-label title="作用域">
            <in-select
              class="w-160px"
              v-model="scopeFilter.scopeType"
              :options="dictScopeEnums.getOptions()"
              @on-changed="handleScopeChange"
            />
          </in-with-label>

          <in-with-label v-if="isTenantScope" title="租户">
            <div class="w-220px">
              <tenant-select v-model="scopeFilter.tenantId" @change="refreshTree" />
            </div>
          </in-with-label>

          <in-with-label v-if="isAppScope" title="应用">
            <div class="w-220px">
              <in-page-select
                v-model="scopeFilter.appId"
                value-field="id"
                label-field="name"
                placeholder="请选择应用"
                :load-data="loadAppOptions"
                @change="refreshTree"
              />
            </div>
          </in-with-label>

          <template #rightActions>
            <in-button @click="handleResetScope"> 重置 </in-button>
            <in-button type="primary" :disabled="!canCreateType" @click="handleCreateType">
              <template #icon>
                <i-ep:plus />
              </template>
              新建字典类型
            </in-button>
          </template>
        </in-filter-item>
      </template>

      <template #left>
        <LeftContent
          ref="leftRef"
          :query="treeQuery"
          @node-click="handleNodeClick"
          @node-edit-click="handleEditCurrentType"
        />
      </template>

      <in-table
        :loading="paging.fetching.value"
        :data="paging.pageInfo.value.records"
        :page="paging.pageInfo.value"
        :headers="visibleHeaders"
        :table-id="DICT_TABLE_ID"
        density="compact"
        row-key="id"
        @handleSizeChange="paging.fetchData"
        @handleCurrentChange="paging.fetchData"
      >
        <template #title>
          <span v-if="currentType">
            当前类型：{{ currentType.name }}
            <span class="code">({{ currentType.code }})</span>
          </span>
          <span v-else class="empty-title">请在左侧选择字典类型</span>
          <span class="in-table__count">共 {{ paging.pageInfo.value.total ?? 0 }} 项</span>
        </template>
        <template #subtitle>
          <div v-if="currentType?.systemFlag" class="system-tip">
            内置字典：禁止修改 code/value/type/scopeType，且不允许删除
          </div>
        </template>
        <template #tools-start>
          <in-table-column-setting
            :headers="tableHeaders"
            :table-id="DICT_TABLE_ID"
            @change="privateOnColumnChange"
          />
          <in-with-label title="名称">
            <el-input
              v-model="paging.condition.keyword"
              class="w-180px"
              clearable
              placeholder="名称前缀匹配"
              @keyup.enter="handleSearch"
              @clear="handleSearch"
            />
          </in-with-label>
          <in-with-label title="状态">
            <in-select
              v-model="paging.condition.status"
              class="w-120px"
              clearable
              :options="statusEnumExt.getOptions()"
              @on-changed="handleSearch"
            />
          </in-with-label>
          <in-button type="primary" :loading="paging.fetching.value" @click="handleSearch">
            搜索
          </in-button>
        </template>
        <template #tools-end>
          <in-table-actions variant="toolbar" :actions="toolbarActions" :row="toolbarRow" />
        </template>

        <template #value="{ item }">
          <in-copy-tag v-if="item.value" :text="item.value" />
          <span v-else>-</span>
        </template>

        <template #label="{ item }">
          <span>{{ item.label || "-" }}</span>
        </template>

        <template #code="{ item }">
          <in-copy-tag :text="item.code" />
        </template>

        <template #name="{ item }">
          <in-button text link @click="handleEdit(item)">
            {{ item.name }}
          </in-button>
        </template>

        <template #scopeType="{ item }">
          <in-tag-enum :value="item.scopeType" :enumObj="dictScopeEnums" />
        </template>

        <template #systemFlag="{ item }">
          <el-tag v-if="item.systemFlag" type="warning" effect="plain"> 系统 </el-tag>
          <el-tag v-else type="info" effect="plain"> 自定义 </el-tag>
        </template>

        <template #status="{ item }">
          <in-common-status-tag :status="item.status" />
        </template>

        <template #actions="{ item }">
          <in-table-actions :actions="rowActionsOf(item)" :row="item" />
        </template>
      </in-table>
    </in-split-layout>
  </in-page-frame>

  <TypeEditDrawer ref="typeEditDrawerRef" @success="handleEditSuccess" />
  <ItemEditDrawer ref="itemEditDrawerRef" @success="handleEditSuccess" />
</template>

<script lang="ts" setup>
import {
  applyColumnSelection,
  Message,
  silentQueryRequest,
  useServerPaging,
  type InTableAction,
} from "@ingot/admin-core";
import type { PlatformDict, DictTreeNodeVO, DictQueryDTO } from "@/models";
import {
  CommonStatus,
  CommonStatusEnumExtArray,
  DictType,
  DictScope,
  useDictScopeEnum,
} from "@/models/enums";
import { ChangeDictStatusAPI, RemoveDictAPI } from "@/api/platform/config/dict.ts";
import { DictPageQueryOptions, dictQueryKeys } from "@/api/platform/config/dict.query";
import { loadAppOptions } from "@/api/platform/config/app.query";
import { TenantSelect } from "@ingot/admin-common";
import LeftContent from "./components/LeftContent.vue";
import TypeEditDrawer, { type TypeEditDrawerAPI } from "./TypeEditDrawer.vue";
import ItemEditDrawer, { type ItemEditDrawerAPI } from "./ItemEditDrawer.vue";
import {
  createDictItemRowActions,
  createDictItemToolbarActions,
  DICT_SPLIT_KEY,
  DICT_TABLE_ID,
  tableHeaders,
} from "./table";
import { useMutation, useQueryClient } from "@tanstack/vue-query";

const queryClient = useQueryClient();
const dictScopeEnums = useDictScopeEnum();
const statusEnumExt = useEnum(CommonStatusEnumExtArray);

const leftRef = ref();
const typeEditDrawerRef = ref<TypeEditDrawerAPI>();
const itemEditDrawerRef = ref<ItemEditDrawerAPI>();

const currentType = ref<DictTreeNodeVO | undefined>();
const selectedColumnProps = ref<string[]>([]);
const toolbarRow: PlatformDict = {};

const visibleHeaders = computed(() =>
  applyColumnSelection(tableHeaders, selectedColumnProps.value),
);

// 顶部作用域过滤
interface ScopeFilter {
  scopeType: DictScope;
  tenantId?: string;
  appId?: string;
}
const scopeFilter = reactive<ScopeFilter>({
  scopeType: DictScope.Platform,
  tenantId: undefined,
  appId: undefined,
});

const isTenantScope = computed(() => scopeFilter.scopeType === DictScope.Tenant);
const isAppScope = computed(() => scopeFilter.scopeType === DictScope.App);

// 提供给左树的查询条件
const treeQuery = computed<DictQueryDTO>(() => ({
  scopeType: scopeFilter.scopeType,
  tenantId: scopeFilter.tenantId,
  appId: scopeFilter.appId,
}));

// 是否允许新建字典类型（租户/应用作用域必须先选中具体的 ID）
const canCreateType = computed(() => {
  if (isTenantScope.value) return Boolean(scopeFilter.tenantId);
  if (isAppScope.value) return Boolean(scopeFilter.appId);
  return true;
});

const paging = useServerPaging<PlatformDict, DictQueryDTO>({
  queryOptions: DictPageQueryOptions,
  queryWhen: (submitted) => Boolean(submitted.code),
});

const refreshTable = (): void => {
  if (!currentType.value) {
    paging.resetSubmitted({} as DictQueryDTO);
    return;
  }
  paging.condition.code = currentType.value.code;
  paging.condition.type = DictType.Item;
  paging.condition.scopeType = scopeFilter.scopeType;
  paging.condition.tenantId = scopeFilter.tenantId;
  paging.condition.appId = scopeFilter.appId;
  paging.search();
};

const handleNodeClick = (node?: DictTreeNodeVO): void => {
  currentType.value = node;
  paging.condition.keyword = undefined;
  paging.condition.status = undefined;
  refreshTable();
};

const refreshTree = (): void => {
  currentType.value = undefined;
  leftRef.value?.refresh();
};

const handleScopeChange = (): void => {
  scopeFilter.tenantId = undefined;
  scopeFilter.appId = undefined;
  refreshTree();
};

const handleResetScope = (): void => {
  scopeFilter.scopeType = DictScope.Platform;
  scopeFilter.tenantId = undefined;
  scopeFilter.appId = undefined;
  refreshTree();
};

const handleSearch = (): void => {
  refreshTable();
};

// 新建 / 编辑：字典类型 与 字典项
const handleCreateType = (): void => {
  typeEditDrawerRef.value?.show({
    scopeContext: {
      scopeType: scopeFilter.scopeType,
      tenantId: scopeFilter.tenantId,
      appId: scopeFilter.appId,
    },
  });
};

const handleCreateItem = (): void => {
  if (!currentType.value) return;
  itemEditDrawerRef.value?.show({ currentType: currentType.value });
};

const handleEdit = (record: PlatformDict): void => {
  if (record.type === DictType.Type) {
    typeEditDrawerRef.value?.show({ record });
  } else if (currentType.value) {
    itemEditDrawerRef.value?.show({ record, currentType: currentType.value });
  }
};

const handleEditCurrentType = (): void => {
  if (!currentType.value) return;
  // DictTreeNodeVO 字段是 PlatformDict 的子集，作为编辑载荷直接复用
  typeEditDrawerRef.value?.show({ record: currentType.value as PlatformDict });
};

const handleEditSuccess = (): void => {
  leftRef.value?.refresh();
  void queryClient.invalidateQueries({ queryKey: dictQueryKeys.all });
  refreshTable();
};

const statusMutation = useMutation({
  mutationFn: (vars: { id: string; status: CommonStatus }) =>
    ChangeDictStatusAPI(vars.id, vars.status, silentQueryRequest()),
  onSuccess: () => {
    void queryClient.invalidateQueries({ queryKey: dictQueryKeys.lists() });
  },
});

const removeMutation = useMutation({
  mutationFn: (id: string) => RemoveDictAPI(id, silentQueryRequest()),
  onSuccess: () => {
    void queryClient.invalidateQueries({ queryKey: dictQueryKeys.lists() });
  },
});

const handleToggleStatus = (record: PlatformDict): void => {
  if (!record.id || !record.status) return;
  const next = record.status === CommonStatus.Enable ? CommonStatus.Lock : CommonStatus.Enable;
  statusMutation.mutateAsync({ id: record.id, status: next }).then(() => {
    Message.success("操作成功");
  });
};

const handleRemove = (record: PlatformDict): void => {
  if (!record.id) return;
  if (record.systemFlag) {
    Message.warning("内置字典不允许该操作");
    return;
  }
  removeMutation.mutateAsync(record.id).then(() => {
    Message.success("删除成功");
  });
};

const toolbarActions = computed(() =>
  createDictItemToolbarActions(handleCreateItem, { disabled: !currentType.value }),
);

const rowActionsOf = (item: PlatformDict): Array<InTableAction<PlatformDict>> =>
  createDictItemRowActions(item, {
    onDetail: handleEdit,
    onToggleStatus: handleToggleStatus,
    onDelete: handleRemove,
  });

const privateOnColumnChange = (value: string[]): void => {
  selectedColumnProps.value = value;
};
</script>

<style scoped lang="postcss">
.code {
  color: var(--in-text-color-secondary);
  font-weight: normal;
  font-size: 14px;
  margin-left: 4px;
}
.empty-title {
  color: var(--in-text-color-placeholder, var(--in-text-color-secondary));
  font-weight: normal;
}
.system-tip {
  color: var(--el-color-warning);
  font-size: 13px;
}
</style>
