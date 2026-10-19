<template>
  <div v-if="!searching" class="flex flex-col">
    <div
      v-for="item in navigation.items.value"
      :key="item.id"
      class="organization-picker-row flex items-center gap-8px h-48px px-8px rounded-4px"
      data-department-row
    >
      <el-checkbox disabled :model-value="false" :aria-label="`${item.name}（部门不可选）`" />
      <biz-organization-picker-avatar department />
      <span class="flex-1 min-w-0 truncate">{{ item.name }}</span>
      <in-button
        link
        type="primary"
        :disabled="navigation.loading.value"
        @in-click="emits('navigate', item.id)"
        >展开</in-button
      >
    </div>
    <biz-organization-picker-more
      kind="departments"
      label="加载更多部门"
      :has-more="navigation.hasMore.value"
      :loading="navigation.loading.value"
      :failed="navigation.failed.value"
      @more="navigation.load(true)"
      @retry="navigation.load(navigation.items.value.length > 0)"
    />
  </div>
</template>
<script setup lang="ts">
import BizOrganizationPickerMore from "./BizOrganizationPickerMore.vue";
import BizOrganizationPickerAvatar from "./BizOrganizationPickerAvatar.vue";
import type { useOrganizationMemberNavigation } from "./organizationMemberPicker";
defineProps<{
  navigation: ReturnType<typeof useOrganizationMemberNavigation>;
  searching: boolean;
}>();
const emits = defineEmits<{ navigate: [id?: string] }>();
</script>
