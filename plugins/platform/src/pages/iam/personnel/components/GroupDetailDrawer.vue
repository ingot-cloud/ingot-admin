<template>
  <in-drawer
    v-model="visible"
    title="用户组详情"
    size="var(--in-drawer-width-detail)"
    padding="0"
    :loading="loading"
  >
    <in-form-group-title title="基本信息" hide-action />
    <in-description-list class="px-20px py-16px">
      <in-description-item label="用户组名称" :value="detail?.record.name" />
      <in-description-item label="用户组 ID" :value="detail?.record.id" />
      <in-description-item label="用户组描述" :value="detail?.record.description" />
      <in-description-item label="成员数" :value="detail?.record.visibleMemberCount" />
    </in-description-list>
    <template #footer>
      <div class="w-full flex items-center justify-between">
        <in-button type="danger" :disabled="!canDelete" @in-click="privateOnDelete">删除</in-button>
        <in-button type="primary" :disabled="!canUpdate" @in-click="privateOnEdit">编辑</in-button>
      </div>
    </template>
  </in-drawer>
</template>

<script setup lang="ts">
import { IamAction, objectActionAllowed } from "@ingot/admin-common";
import { PlatformGroupDetailAPI } from "@/api/iam/personnel";
import type { GroupRow } from "../groupTable";

defineOptions({ name: "GroupDetailDrawer" });

const emits = defineEmits<{
  edit: [row: GroupRow];
  delete: [row: GroupRow];
}>();

const visible = ref(false);
const loading = ref(false);
const detail = ref<GroupRow>();

const canDelete = computed(() => {
  const current = detail.value;
  return current
    ? objectActionAllowed(current.capabilities, IamAction.PLATFORM_GROUP_DELETE).allowed
    : false;
});
const canUpdate = computed(() => {
  const current = detail.value;
  return current
    ? objectActionAllowed(current.capabilities, IamAction.PLATFORM_GROUP_UPDATE).allowed
    : false;
});

const show = (row: GroupRow): void => {
  visible.value = true;
  detail.value = row;
  loading.value = true;
  PlatformGroupDetailAPI(row.record.id)
    .then((response) => {
      detail.value = response.data;
    })
    .finally(() => {
      loading.value = false;
    });
};

const privateOnEdit = (): void => {
  if (!detail.value) {
    return;
  }
  visible.value = false;
  emits("edit", detail.value);
};
const privateOnDelete = (): void => {
  if (!detail.value) {
    return;
  }
  emits("delete", detail.value);
};

const hide = (): void => {
  visible.value = false;
};

defineExpose({ show, hide });
</script>
