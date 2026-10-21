<template>
  <div
    class="flex items-center gap-8px min-w-0 overflow-hidden"
    :class="wrap ? 'flex-wrap' : 'flex-nowrap'"
  >
    <in-selection-tag
      v-for="item in shown"
      :key="item.id"
      class="iam-member-chip"
      :class="{ 'is-plain': !tagged }"
      :name="item.name"
      :avatar="item.avatar"
      :show-avatar="showAvatar"
      :closable="closable"
      :background="tagged ? undefined : 'transparent'"
      :close-label="`移除 ${item.name}`"
      :title="`${item.name}${item.available === false ? '（不可用，待交接）' : ''}`"
      @close="emits('remove', item.id)"
    >
      <template v-if="primaryMemberId === item.id || (tagged && item.available === false)" #suffix>
        <span v-if="primaryMemberId === item.id" class="iam-member-chip__primary"
          >部门主负责人</span
        >
        <span
          v-if="tagged && item.available === false"
          class="text-12px text-[var(--el-color-warning)]"
          >不可用，待交接</span
        >
      </template>
    </in-selection-tag>
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
import { InSelectionTag, selectionOverflowCount } from "@ingot/admin-core";
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
  selectionOverflowCount(props.total ?? props.members.length, shown.value.length),
);
</script>
<style scoped>
.iam-member-chip {
  flex-shrink: 0;
  max-width: 160px;
}
.iam-member-chip:not(.is-plain) {
  max-width: 100%;
}
.iam-member-chip.is-plain {
  padding-left: 0;
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
