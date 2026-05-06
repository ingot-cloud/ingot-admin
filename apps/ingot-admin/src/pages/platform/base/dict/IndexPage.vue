<template>
  <in-filter-container>
    <template #header>
      <in-filter-item>
        <in-with-label title="作用域">
          <in-select
            style="width: 160px"
            v-model="scopeFilter.scopeType"
            :options="dictScopeEnums.getOptions()"
            @on-changed="handleScopeChange"
          />
        </in-with-label>

        <in-with-label v-if="isTenantScope" title="租户">
          <div style="width: 220px">
            <tenant-select v-model="scopeFilter.tenantId" @change="refreshTree" />
          </div>
        </in-with-label>

        <in-with-label v-if="isAppScope" title="应用">
          <div style="width: 220px">
            <in-page-select
              v-model="scopeFilter.appId"
              value-field="id"
              label-field="name"
              placeholder="请选择应用"
              :load-data="loadAppData"
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
        @onNodeClick="handleNodeClick"
        @onNodeEditClick="handleEditCurrentType"
      />
    </template>

    <in-table
      :loading="paging.loading.value"
      :data="paging.pageInfo.records"
      :page="paging.pageInfo"
      :headers="tableHeaders"
      ref="tableRef"
      row-key="id"
      @refresh="paging.exec"
      @handleSizeChange="paging.exec"
      @handleCurrentChange="paging.exec"
    >
      <template #title>
        <div v-if="currentType" class="title-wrap">
          <span>
            当前类型：{{ currentType.name }}
            <span class="code">({{ currentType.code }})</span>
          </span>
        </div>
        <div v-else class="empty-title">请在左侧选择字典类型</div>
      </template>
      <template #subtitle>
        <div v-if="currentType?.systemFlag" class="system-tip">
          内置字典：禁止修改 code/value/type/scopeType，且不允许删除
        </div>
      </template>
      <template #toolbar>
        <in-button type="primary" :disabled="!currentType" @click="handleCreateItem">
          <template #icon>
            <i-ep:plus />
          </template>
          新建字典项
        </in-button>
        <el-divider direction="vertical" />
        <in-with-label title="名称">
          <el-input
            v-model="paging.condition.keyword"
            style="width: 180px"
            clearable
            placeholder="名称前缀匹配"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
        </in-with-label>
        <in-with-label title="状态">
          <in-select
            v-model="paging.condition.status"
            style="width: 120px"
            clearable
            :options="statusEnumExt.getOptions()"
            @on-changed="handleSearch"
          />
        </in-with-label>
        <in-button type="primary" :loading="paging.loading.value" @click="handleSearch">
          搜索
        </in-button>
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
        <common-status-tag :status="item.status" />
      </template>

      <template #actions="{ item }">
        <in-button text link type="primary" @click="handleEdit(item)">
          <template #icon>
            <i-ep:edit />
          </template>
          编辑
        </in-button>
        <common-status-button text link :status="item.status" @click="handleToggleStatus(item)" />
        <in-button-delete v-if="!item.systemFlag" @click="handleRemove(item)" />
      </template>
    </in-table>
  </in-filter-container>

  <TypeEditDrawer ref="typeEditDrawerRef" @success="handleEditSuccess" />
  <ItemEditDrawer ref="itemEditDrawerRef" @success="handleEditSuccess" />
</template>
<script lang="ts" setup>
import type {
  PlatformDict,
  DictTreeNodeVO,
  DictQueryDTO,
  ApplicationPageItemVO,
  Page,
} from "@/models";
import type { LoadDataParams } from "@/components/select/InPageSelect.vue";
import type { TableAPI } from "@/components/table";
import {
  CommonStatus,
  CommonStatusEnumExtArray,
  DictType,
  DictScope,
  useDictScopeEnum,
} from "@/models/enums";
import { GetDictPageAPI, ChangeDictStatusAPI, RemoveDictAPI } from "@/api/platform/base/dict";
import { GetAppPageAPI } from "@/api/platform/base/app";
import TenantSelect from "@/components/biz/TenantSelect.vue";
import LeftContent from "./components/LeftContent.vue";
import TypeEditDrawer, { type TypeEditDrawerAPI } from "./TypeEditDrawer.vue";
import ItemEditDrawer, { type ItemEditDrawerAPI } from "./ItemEditDrawer.vue";
import { tableHeaders } from "./table";
import { Confirm, Message } from "@/utils/message";

const dictScopeEnums = useDictScopeEnum();
const statusEnumExt = useEnum(CommonStatusEnumExtArray);

const tableRef = ref<TableAPI>();
const leftRef = ref();
const typeEditDrawerRef = ref<TypeEditDrawerAPI>();
const itemEditDrawerRef = ref<ItemEditDrawerAPI>();

const currentType = ref<DictTreeNodeVO | undefined>();

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

// 分页
const fetchPageFn = transformPageAPI<PlatformDict, DictQueryDTO>(GetDictPageAPI);
const paging = usePaging<PlatformDict, DictQueryDTO>(fetchPageFn);

const refreshTable = (): void => {
  if (!currentType.value) {
    paging.pageInfo.records = [];
    paging.pageInfo.total = 0;
    return;
  }
  paging.condition.code = currentType.value.code;
  paging.condition.type = DictType.Item;
  paging.condition.scopeType = scopeFilter.scopeType;
  paging.condition.tenantId = scopeFilter.tenantId;
  paging.condition.appId = scopeFilter.appId;
  paging.exec({ type: "current", value: 1 });
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

const loadAppData = async (params: LoadDataParams): Promise<Page<ApplicationPageItemVO>> => {
  const result = await GetAppPageAPI(
    { current: params.current, size: params.size },
    { name: params.query },
  );
  return result.data;
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

const handleEditCurrentType = (node?: DictTreeNodeVO): void => {
  if (!currentType.value) return;
  // DictTreeNodeVO 字段是 PlatformDict 的子集，作为编辑载荷直接复用
  typeEditDrawerRef.value?.show({ record: currentType.value as PlatformDict });
};

const handleEditSuccess = (): void => {
  leftRef.value?.refresh();
  refreshTable();
};

// 状态切换
const handleToggleStatus = (record: PlatformDict): void => {
  if (!record.id || !record.status) return;
  const next = record.status === CommonStatus.Enable ? CommonStatus.Lock : CommonStatus.Enable;
  const action = next === CommonStatus.Enable ? "启用" : "禁用";
  Confirm.warning(`是否${action}字典(${record.label || record.name})`).then(() => {
    ChangeDictStatusAPI(record.id!, next).then(() => {
      Message.success("操作成功");
      refreshTable();
    });
  });
};

const handleRemove = (record: PlatformDict): void => {
  if (!record.id) return;
  if (record.systemFlag) {
    Message.warning("内置字典不允许该操作");
    return;
  }
  Confirm.warning(`是否删除字典项(${record.label || record.name})`).then(() => {
    RemoveDictAPI(record.id!).then(() => {
      Message.success("删除成功");
      refreshTable();
    });
  });
};
</script>
<style scoped lang="postcss">
.title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}
.code {
  color: rgba(23, 26, 29, 0.6);
  font-weight: normal;
  font-size: 14px;
  margin-left: 4px;
}
.empty-title {
  color: rgba(23, 26, 29, 0.45);
  font-weight: normal;
}
.system-tip {
  color: var(--el-color-warning);
  font-size: 13px;
}
</style>
