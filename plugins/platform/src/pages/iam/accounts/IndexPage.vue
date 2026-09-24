<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header description="全局登录账号与成员资格分离。启停锁定改密走安全用例，不展示组织关系。" />
    </template>
    <in-split-layout>
      <in-table
        :loading="paging.fetching.value"
        :data="paging.pageInfo.value.records"
        :page="paging.pageInfo.value"
        :headers="visibleHeaders"
        :table-id="TABLE_ID"
        :feedback="tableFeedback"
        density="compact"
        :row-key="rowKeyOf"
        @handleSizeChange="paging.fetchData"
        @handleCurrentChange="paging.fetchData"
      >
        <template #tools-start>
          <el-input
            v-model="paging.condition.username"
            class="w-220px!"
            clearable
            placeholder="精确登录名查找"
            :prefix-icon="Search"
            @keyup.enter="refreshData"
            @clear="refreshData"
          />
          <in-table-column-setting
            :headers="tableHeaders"
            :table-id="TABLE_ID"
            @change="privateOnColumnChange"
          />
        </template>
        <template #tools-end>
          <in-table-actions variant="toolbar" :actions="toolbarActions" :row="emptyAccountRow" />
        </template>
        <template #username="{ item }">
          <div class="whitespace-nowrap">
            <biz-iam-record-link
              :action="IamAction.PLATFORM_ACCOUNT_READ"
              :capabilities="item.capabilities"
              @click="handleDetail(item)"
            >
              {{ item.record.username || item.record.id }}
            </biz-iam-record-link>
          </div>
        </template>
        <template #phone="{ item }">{{ item.record.phone || "-" }}</template>
        <template #email="{ item }">{{ item.record.email || "-" }}</template>
        <template #enabled="{ item }">
          <el-tag :type="item.record.enabled ? 'success' : 'info'" effect="plain">
            {{ item.record.enabled ? "启用" : "停用" }}
          </el-tag>
        </template>
        <template #locked="{ item }">
          <el-tag :type="item.record.locked ? 'warning' : 'success'" effect="plain">
            {{ item.record.locked ? "锁定" : "正常" }}
          </el-tag>
        </template>
        <template #actions="{ item }">
          <in-table-actions :actions="rowActionsOf(item)" :row="item" />
        </template>
      </in-table>
    </in-split-layout>
  </in-page-frame>

  <CreateDrawer ref="createRef" @success="handleCreateSuccess" />
  <DetailDrawer ref="detailRef" @success="refreshData" />
  <LockDrawer ref="lockRef" @success="refreshData" />
  <SecretDialog ref="secretRef" />
</template>

<script lang="ts" setup>
import { Search } from "@element-plus/icons-vue";
import {
  applyColumnSelection,
  Confirm,
  Message,
  useCapabilities,
  type InTableAction,
  type InTableFeedback,
} from "@ingot/admin-core";
import { BizIamRecordLink, IamAction, type AccountSecret } from "@ingot/admin-common";
import {
  PlatformAccountDeleteAPI,
  PlatformAccountDisableAPI,
  PlatformAccountEnableAPI,
  PlatformAccountResetPasswordAPI,
  PlatformAccountUnlockAPI,
} from "@/api/iam/accounts";
import { platformAccountQueryKeys } from "@/api/iam/accounts.query";
import { useQueryClient } from "@tanstack/vue-query";
import CreateDrawer from "./components/CreateDrawer.vue";
import DetailDrawer from "./components/DetailDrawer.vue";
import LockDrawer from "./components/LockDrawer.vue";
import SecretDialog from "./components/SecretDialog.vue";
import {
  createRowActions,
  createToolbarActions,
  emptyAccountRow,
  tableHeaders,
  TABLE_ID,
  type Row,
} from "./table";
import { useOps } from "./useOps";

const { paging, refreshData } = useOps();
const { unavailable } = useCapabilities();
const queryClient = useQueryClient();
const route = useRoute();
const go = useGo();
const selectedColumnProps = ref<string[]>([]);
const createRef = ref<{ show: (username?: string) => void }>();
const detailRef = ref<{ show: (row: Row) => void }>();
const lockRef = ref<{ show: (row: Row) => void }>();
const secretRef = ref<{ show: (password: string) => void }>();

const visibleHeaders = computed(() => applyColumnSelection(tableHeaders, selectedColumnProps.value));
const tableFeedback = computed<InTableFeedback>(() => (unavailable.value ? "error" : "empty"));

const invalidate = (): void => {
  void queryClient.invalidateQueries({ queryKey: platformAccountQueryKeys.lists() });
  refreshData();
};

const handleCreate = (): void => {
  createRef.value?.show();
};
const handleCreateSuccess = (secret: AccountSecret): void => {
  if (secret.password) {
    secretRef.value?.show(secret.password);
  }
  invalidate();
};

const consumePrefill = (): void => {
  const raw = route.query.username;
  const prefill = typeof raw === "string" ? raw : Array.isArray(raw) ? String(raw[0] ?? "") : "";
  if (!prefill) {
    return;
  }
  void nextTick(() => {
    createRef.value?.show(prefill);
    if (route.name) {
      go({ name: route.name, query: {} }, true);
    }
  });
};

watch(
  () => [route.query.username, createRef.value] as const,
  () => {
    consumePrefill();
  },
);
const handleDetail = (item: Row): void => {
  detailRef.value?.show(item);
};
const handleEnable = (item: Row): void => {
  Confirm.warning(`是否启用账号（${item.record.username}）？`).then(() => {
    PlatformAccountEnableAPI(item.record.id, { expectedVersion: item.version }).then(() => {
      Message.success("已启用");
      invalidate();
    });
  });
};
const handleDisable = (item: Row): void => {
  Confirm.warning(`停用只影响全局登录，不删除成员资格。是否停用（${item.record.username}）？`).then(
    () => {
      PlatformAccountDisableAPI(item.record.id, { expectedVersion: item.version }).then(() => {
        Message.success("已停用");
        invalidate();
      });
    },
  );
};
const handleLock = (item: Row): void => {
  lockRef.value?.show(item);
};
const handleUnlock = (item: Row): void => {
  Confirm.warning(`是否解锁账号（${item.record.username}）？`).then(() => {
    PlatformAccountUnlockAPI(item.record.id, { expectedVersion: item.version }).then(() => {
      Message.success("已解锁");
      invalidate();
    });
  });
};
const handleResetPassword = (item: Row): void => {
  Confirm.warning(`将生成一次性初始密码，关闭后无法再读。是否重置（${item.record.username}）？`).then(
    () => {
      PlatformAccountResetPasswordAPI(item.record.id, { expectedVersion: item.version }).then(
        (response) => {
          secretRef.value?.show(response.data.password);
          invalidate();
        },
      );
    },
  );
};
const handleDelete = (item: Row): void => {
  Confirm.error(`仍有成员资格时无法删除。是否删除账号（${item.record.username}）？`, {
    confirmButtonText: "删除",
  }).then(() => {
    PlatformAccountDeleteAPI(item.record.id, { expectedVersion: item.version }).then(() => {
      Message.success("已删除");
      invalidate();
    });
  });
};

const toolbarActions = computed(() => createToolbarActions(handleCreate));
const rowActionsOf = (item: Row): Array<InTableAction<Row>> =>
  createRowActions(item, {
    onDetail: handleDetail,
    onEnable: handleEnable,
    onDisable: handleDisable,
    onLock: handleLock,
    onUnlock: handleUnlock,
    onResetPassword: handleResetPassword,
    onDelete: handleDelete,
  });
const privateOnColumnChange = (value: string[]): void => {
  selectedColumnProps.value = value;
};
const rowKeyOf = (row: Row): string => row.record.id;
</script>
