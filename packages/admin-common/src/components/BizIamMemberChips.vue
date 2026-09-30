<template>
  <div class="flex flex-nowrap items-center gap-8px min-w-0 overflow-hidden">
    <span
      v-for="item in shown"
      :key="item.id"
      class="inline-flex items-center gap-4px max-w-160px shrink-0"
    >
      <in-avatar
        v-if="showAvatar"
        :src="item.avatar"
        :name="item.name"
        :show-name="false"
        :size="20"
      />
      <span class="truncate">{{ item.name }}</span>
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
  }>(),
  {
    closable: false,
    emptyText: "请选择成员",
    showAvatar: true,
  },
);

const emits = defineEmits<{ remove: [id: string] }>();

const shown = computed(() => visibleMembers(props.members));
const extra = computed(() =>
  Math.max(0, (props.total ?? props.members.length) - shown.value.length),
);
</script>
