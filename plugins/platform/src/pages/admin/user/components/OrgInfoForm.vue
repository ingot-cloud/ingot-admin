<template>
  <div v-loading="loading">
    <div v-if="orgList && orgList.length > 0">
      <OrgInfoFormItem
        v-for="org in orgList"
        :key="org.orgId"
        :user-id="userId"
        :org="org"
        ref="OrgInfoFormItemRef"
        @success="privateRefresh"
      />
    </div>
    <el-empty v-else description="暂无组织" />
  </div>
  <OrgInfoCreateDialog ref="CreateDialogRef" @success="privateRefresh" />
</template>
<script setup lang="ts">
import { PlatformAdminUserOrgInfoQueryOptions, platformAdminUserQueryKeys } from "@/api/platform/admin/user.query";
import OrgInfoFormItem from "./OrgInfoFormItem.vue";
import OrgInfoCreateDialog from "./OrgInfoCreateDialog.vue";
import { useQuery, useQueryClient } from "@tanstack/vue-query";

const CreateDialogRef = ref();
const OrgInfoFormItemRef = ref();
const queryClient = useQueryClient();
const userId = ref("");
const orgQuery = useQuery(() => ({
  ...PlatformAdminUserOrgInfoQueryOptions(() => userId.value),
  enabled: Boolean(userId.value),
}));
const loading = computed(() => orgQuery.isFetching.value);
const orgList = computed(() => orgQuery.data.value ?? []);

const privateRefresh = (): void => {
  if (!userId.value) {
    return;
  }
  void queryClient.invalidateQueries({ queryKey: platformAdminUserQueryKeys.orgs(userId.value) });
};

watch(orgList, (list) => {
  if (list.length === 0) {
    return;
  }
  nextTick(() => {
    const refs = OrgInfoFormItemRef.value;
    const list = Array.isArray(refs) ? refs : refs ? [refs] : [];
    list.forEach((itemRef: { refresh?: () => void }) => {
      itemRef.refresh?.();
    });
  });
});

defineExpose({
  setData(id: string) {
    userId.value = id;
  },
  addOrg(id: string) {
    CreateDialogRef.value.show(id);
  },
});
</script>
