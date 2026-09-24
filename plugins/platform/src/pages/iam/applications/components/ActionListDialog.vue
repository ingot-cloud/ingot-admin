<template>
  <in-dialog v-model="visible" :title="title" width="920px" layout="pinned" append-to-body>
    <in-table
      :loading="loading"
      :data="page.records"
      :page="page"
      :headers="actionHeaders"
      density="compact"
      :row-key="actionKeyOf"
      @handleSizeChange="privateOnSizeChange"
      @handleCurrentChange="privateOnCurrentChange"
    >
      <template #tools-start>
        <el-input
          v-model="nameFilter"
          class="w-200px!"
          clearable
          placeholder="搜索操作名"
          :prefix-icon="Search"
          @keyup.enter="privateOnSearch"
          @clear="privateOnSearch"
        />
      </template>
      <template #tools-end>
        <in-button v-if="local" @click="privateCreate">创建操作</in-button>
        <in-button v-else v-auth="IamAction.PLATFORM_ACTION_CREATE" @click="privateCreate">
          创建操作
        </in-button>
      </template>
      <template #name="{ item }">{{ asAction(item).record.name }}</template>
      <template #code="{ item }">
        <in-copy-tag :text="asAction(item).record.code" />
      </template>
      <template #status="{ item }">
        <biz-iam-status-tag :status="asAction(item).record.status" />
      </template>
      <template #actions="{ item }">
        <in-button text link @click="privateEdit(asAction(item))">编辑</in-button>
        <in-button v-if="!local" text link @click="privateToggle(asAction(item))">
          {{ asAction(item).record.status === ConfigurationStatus.ENABLED ? "停用" : "启用" }}
        </in-button>
        <in-button text link type="danger" @click="privateDelete(asAction(item))">删除</in-button>
      </template>
    </in-table>
    <template #footer>
      <in-button @click="visible = false">关闭</in-button>
    </template>
  </in-dialog>

  <ActionEditDrawer
    ref="editRef"
    :submit="submitAction"
    @success="loadActions"
    @close="privateOnEditorClose"
  />
</template>

<script setup lang="ts">
import { Search } from "@element-plus/icons-vue";
import { Confirm, Message, type Page } from "@ingot/admin-core";
import {
  BizIamStatusTag,
  ConfigurationStatus,
  IAM_DEFAULT_PAGE_SIZE,
  IamAction,
  type AppActionRecord,
  type AppResourceRecord,
  type ResourceDetail,
} from "@ingot/admin-common";
import {
  PlatformActionDeleteAPI,
  PlatformActionPageAPI,
  PlatformActionStatusAPI,
} from "@/api/iam/catalog";
import { actionHeaders } from "../table";
import ActionEditDrawer from "./ActionEditDrawer.vue";

defineOptions({ name: "ApplicationActionListDialog" });

const props = defineProps<{
  loadActions?: (input: {
    current: number;
    size: number;
    resourceId: string;
    name?: string;
  }) => Promise<Page<ResourceDetail<AppActionRecord>>>;
  submitAction?: (
    input: { resourceId: string; code: string; name: string },
    editing?: ResourceDetail<AppActionRecord>,
  ) => void | Promise<void>;
  deleteAction?: (row: ResourceDetail<AppActionRecord>) => void | Promise<void>;
}>();

const local = computed(() => Boolean(props.loadActions));
const visible = ref(false);
const loading = ref(false);
const applicationId = ref("");
const resource = ref<ResourceDetail<AppResourceRecord>>();
const applicationCode = ref("");
const editRef = ref<{
  show: (
    appId: string,
    resourceList: Array<ResourceDetail<AppResourceRecord>>,
    target?: ResourceDetail<AppActionRecord>,
    preferredResourceId?: string,
    lockResource?: boolean,
    appCode?: string,
  ) => void;
}>();
const nameFilter = ref("");
const page = ref<Page<ResourceDetail<AppActionRecord>>>({
  current: 1,
  size: IAM_DEFAULT_PAGE_SIZE,
  total: 0,
  records: [],
});

const title = computed(() => `操作 · ${resource.value?.record.name ?? ""}`);
const actionKeyOf = (row: ResourceDetail<AppActionRecord>): string => row.record.id;
const asAction = (row: unknown): ResourceDetail<AppActionRecord> =>
  row as ResourceDetail<AppActionRecord>;

const loadActions = (): void => {
  if (!resource.value) {
    return;
  }
  loading.value = true;
  const query = {
    current: page.value.current,
    size: page.value.size,
    resourceId: resource.value.record.id,
    name: nameFilter.value.trim() || undefined,
  };
  const request = props.loadActions
    ? props.loadActions(query)
    : PlatformActionPageAPI(
        applicationId.value,
        { current: query.current, size: query.size },
        { resourceId: query.resourceId, name: query.name },
      ).then((response) => response.data);
  request
    .then((data) => {
      page.value = data;
    })
    .finally(() => {
      loading.value = false;
    });
};

const privateOnSearch = (): void => {
  page.value.current = 1;
  loadActions();
};

const privateOnSizeChange = (payload: { value: number }): void => {
  page.value.size = payload.value;
  page.value.current = 1;
  loadActions();
};

const privateOnCurrentChange = (payload: { value: number }): void => {
  page.value.current = payload.value;
  loadActions();
};

const requireContext = ():
  | { appId: string; current: ResourceDetail<AppResourceRecord> }
  | undefined => {
  if (!applicationId.value || !resource.value) {
    return undefined;
  }
  return { appId: applicationId.value, current: resource.value };
};

const openEditor = (
  target?: ResourceDetail<AppActionRecord>,
): void => {
  const context = requireContext();
  if (!context) {
    return;
  }
  visible.value = false;
  nextTick(() => {
    editRef.value?.show(
      context.appId,
      [context.current],
      target,
      context.current.record.id,
      true,
      applicationCode.value,
    );
  });
};

const privateCreate = (): void => {
  openEditor();
};

const privateEdit = (row: ResourceDetail<AppActionRecord>): void => {
  openEditor(row);
};

const privateOnEditorClose = (): void => {
  if (resource.value) {
    visible.value = true;
  }
};

const privateToggle = (row: ResourceDetail<AppActionRecord>): void => {
  const context = requireContext();
  if (!context) {
    return;
  }
  const next =
    row.record.status === ConfigurationStatus.ENABLED
      ? ConfigurationStatus.DISABLED
      : ConfigurationStatus.ENABLED;
  PlatformActionStatusAPI(context.appId, row.record.id, {
    expectedVersion: row.version,
    status: next,
  }).then(() => {
    Message.success(next === ConfigurationStatus.ENABLED ? "已启用" : "已停用");
    loadActions();
  });
};

const privateDelete = (row: ResourceDetail<AppActionRecord>): void => {
  const context = requireContext();
  if (!context) {
    return;
  }
  Confirm.warning(`是否删除操作（${row.record.code}）？`).then(() => {
    const removed = props.deleteAction
      ? Promise.resolve(props.deleteAction(row))
      : PlatformActionDeleteAPI(context.appId, row.record.id);
    removed.then(() => {
      Message.success("已删除");
      loadActions();
    });
  });
};

defineExpose({
  show(appId: string, target: ResourceDetail<AppResourceRecord>, appCode: string) {
    applicationId.value = appId;
    applicationCode.value = appCode;
    resource.value = target;
    nameFilter.value = "";
    page.value = {
      current: 1,
      size: IAM_DEFAULT_PAGE_SIZE,
      total: 0,
      records: [],
    };
    visible.value = true;
    loadActions();
  },
});
</script>
