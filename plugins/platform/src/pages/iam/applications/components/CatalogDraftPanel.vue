<template>
  <div class="flex flex-col h-full min-h-0">
    <in-table
      :data="visibleResources"
      :headers="resourceHeaders"
      density="compact"
      :row-key="resourceKeyOf"
    >
      <template #tools-start>
        <el-input
          v-model="nameFilter"
          class="w-200px!"
          clearable
          placeholder="搜索资源名"
          :prefix-icon="Search"
        />
        <el-input
          v-model="codeFilter"
          class="w-200px!"
          clearable
          placeholder="搜索资源编码"
          :prefix-icon="Search"
        />
      </template>
      <template #tools-end>
        <in-button @in-click="privateCreateResource">创建资源</in-button>
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
        <in-button text link type="danger" @click="privateDeleteResource(asResource(item))">
          删除
        </in-button>
      </template>
    </in-table>
  </div>

  <resource-edit-drawer ref="resourceRef" :submit="privateSubmitResource" />
  <action-list-dialog
    ref="actionListRef"
    :load-actions="loadDraftActions"
    :submit-action="privateSubmitAction"
    :delete-action="privateDeleteAction"
  />
</template>

<script setup lang="ts">
import { Search } from "@element-plus/icons-vue";
import { Confirm, type Page } from "@ingot/admin-core";
import {
  IAM_DEFAULT_PAGE_SIZE,
  formatScopeKinds,
  type AppActionRecord,
  type AppResourceDraft,
  type AppResourceRecord,
  type ResourceDetail,
} from "@ingot/admin-common";
import {
  asActionDetail,
  asResourceDetail,
  emptyDraftAction,
  emptyDraftResource,
  type AppWizardProfile,
  type DraftResource,
} from "../createWizard";
import { resourceHeaders } from "../table";
import ActionListDialog from "./ActionListDialog.vue";
import ResourceEditDrawer from "./ResourceEditDrawer.vue";

defineOptions({ name: "CatalogDraftPanel" });

const props = defineProps<{
  profile: AppWizardProfile;
}>();

const resources = defineModel<DraftResource[]>({ default: () => [] });
const nameFilter = ref("");
const codeFilter = ref("");
const resourceRef = ref<{ show: (appId: string, target?: ResourceDetail<AppResourceRecord>) => void }>();
const actionListRef = ref<{
  show: (appId: string, target: ResourceDetail<AppResourceRecord>, appCode: string) => void;
}>();

const resourceKeyOf = (row: ResourceDetail<AppResourceRecord>): string => row.record.id;
const asResource = (row: unknown): ResourceDetail<AppResourceRecord> =>
  row as ResourceDetail<AppResourceRecord>;

const visibleResources = computed(() => {
  const name = nameFilter.value.trim().toLowerCase();
  const code = codeFilter.value.trim().toLowerCase();
  return resources.value
    .filter((item) => {
      if (name && !item.name.toLowerCase().includes(name)) {
        return false;
      }
      return !code || item.code.toLowerCase().includes(code);
    })
    .map(asResourceDetail);
});

const resourceOf = (id: string): DraftResource | undefined =>
  resources.value.find((item) => item.tempId === id);

const privateCreateResource = (): void => {
  resourceRef.value?.show(props.profile.code || "draft");
};

const privateEditResource = (row: ResourceDetail<AppResourceRecord>): void => {
  resourceRef.value?.show(props.profile.code || "draft", row);
};

const privateSubmitResource = (draft: AppResourceDraft, editing?: ResourceDetail<AppResourceRecord>): void => {
  if (editing) {
    const current = resourceOf(editing.record.id);
    if (current) {
      current.name = draft.name;
      current.scopeCapabilities = [...draft.scopeCapabilities];
      current.fieldCapabilities = draft.fieldCapabilities.map((item) => ({
        ...item,
        visibilities: [...item.visibilities],
      }));
    }
    return;
  }
  resources.value = [
    ...resources.value,
    {
      ...emptyDraftResource(),
      code: draft.code,
      name: draft.name,
      scopeCapabilities: [...draft.scopeCapabilities],
      fieldCapabilities: draft.fieldCapabilities.map((item) => ({
        ...item,
        visibilities: [...item.visibilities],
      })),
    },
  ];
};

const privateDeleteResource = (row: ResourceDetail<AppResourceRecord>): void => {
  Confirm.warning(`是否删除资源（${row.record.name}）？`).then(() => {
    resources.value = resources.value.filter((item) => item.tempId !== row.record.id);
  });
};

const privateOpenActions = (row: ResourceDetail<AppResourceRecord>): void => {
  actionListRef.value?.show(props.profile.code || "draft", row, props.profile.code);
};

const loadDraftActions = (input: {
  current: number;
  size: number;
  resourceId: string;
  name?: string;
}): Promise<Page<ResourceDetail<AppActionRecord>>> => {
  const resource = resourceOf(input.resourceId);
  const keyword = input.name?.trim().toLowerCase() ?? "";
  if (!resource) {
    return Promise.resolve({ current: input.current, size: input.size, total: 0, records: [] });
  }
  const all = resource.actions
    .filter((item) => !keyword || item.name.toLowerCase().includes(keyword))
    .map((item) => asActionDetail(resource, item, props.profile));
  const size = input.size || IAM_DEFAULT_PAGE_SIZE;
  const start = (input.current - 1) * size;
  return Promise.resolve({
    current: input.current,
    size,
    total: all.length,
    records: all.slice(start, start + size),
  });
};

const privateSubmitAction = (
  input: { resourceId: string; code: string; name: string },
  editing?: ResourceDetail<AppActionRecord>,
): void => {
  const resource = resourceOf(input.resourceId);
  if (!resource) {
    return;
  }
  if (editing) {
    const current = resource.actions.find((item) => item.tempId === editing.record.id);
    if (current) {
      current.name = input.name;
    }
    return;
  }
  resource.actions = [
    ...resource.actions,
    { ...emptyDraftAction(), code: input.code, name: input.name },
  ];
};

const privateDeleteAction = (row: ResourceDetail<AppActionRecord>): void => {
  const resource = resourceOf(row.record.resourceId);
  if (resource) {
    resource.actions = resource.actions.filter((item) => item.tempId !== row.record.id);
  }
};
</script>
