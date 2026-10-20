<template>
  <div
    class="flex items-center gap-8px min-w-0 overflow-hidden"
    :class="wrap ? 'flex-wrap' : 'flex-nowrap'"
  >
    <span
      v-for="item in shown"
      :key="item.id"
      class="inline-flex items-center gap-4px max-w-160px shrink-0"
      :class="{ 'iam-member-chip': tagged }"
      :title="`${item.name}${item.available === false ? '（不可用，待交接）' : ''}`"
    >
      <in-avatar
        v-if="showAvatar"
        :src="item.avatar"
        :name="item.name"
        :show-name="false"
        :size="20"
      />
      <span class="truncate">{{ item.name }}</span>
      <span v-if="primaryMemberId === item.id" class="iam-member-chip__primary">部门主负责人</span>
      <span
        v-if="tagged && item.available === false"
        class="text-12px text-[var(--el-color-warning)]"
        >不可用，待交接</span
      >
      <in-close-button
        v-if="closable"
        size="sm"
        :label="`移除 ${item.name}`"
        @click="emits('remove', item.id)"
      />
    </span>
    <span v-if="extra > 0" class="shrink-0 text-[var(--el-text-color-secondary)]"
      >+{{ extra }}</span
    >
    <span
      v-if="!shown.length && extra <= 0"
      class="truncate text-[var(--in-text-color-placeholder)]"
    >
      {{ emptyText }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { InAvatar, InCloseButton } from "@ingot/admin-core";
import { visibleMembers, type MemberChip } from "./memberChipOverflow";

defineOptions({ name: "BizIamMemberChips" });

const props = withDefaults(
  defineProps<{
    members: MemberChip[];
    total?: number;
    closable?: boolean;
    emptyText?: string;
    showAvatar?: boolean;
    tagged?: boolean;
    wrap?: boolean;
    primaryMemberId?: string;
  }>(),
  {
    closable: false,
    emptyText: "请选择成员",
    showAvatar: true,
    tagged: false,
    wrap: false,
  },
);

const emits = defineEmits<{ remove: [id: string] }>();

const shown = computed(() => visibleMembers(props.members));
const extra = computed(() =>
  Math.max(0, (props.total ?? props.members.length) - shown.value.length),
);
</script>
<style scoped>
.iam-member-chip {
  --in-text-color-inverse: var(--in-tag-solid-text-color);
  max-width: 100%;
  padding: 2px 6px 2px 2px;
  border-radius: 999px;
  background: var(--el-fill-color-light);
  color: var(--in-text-color);
  line-height: 20px;
}
.iam-member-chip :deep(.in-avatar__fallback) {
  font-size: 10px;
  white-space: nowrap;
}
.iam-member-chip__primary {
  flex-shrink: 0;
  padding: 0 4px;
  border-radius: 4px;
  font-size: 10px;
  line-height: 16px;
  color: var(--in-color-primary);
  background: color-mix(in srgb, var(--in-color-primary) 14%, var(--in-bg-color-surface));
}
</style>
