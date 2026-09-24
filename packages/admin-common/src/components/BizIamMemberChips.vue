<template>
  <div class="flex flex-nowrap items-center gap-8px min-w-0 overflow-hidden">
    <span
      v-for="item in shown"
      :key="item.id"
      class="inline-flex items-center gap-4px max-w-160px shrink-0"
    >
      <in-avatar :src="item.avatar" :name="item.name" :show-name="false" :size="20" />
      <span class="truncate">{{ item.name }}</span>
      <in-close-button
        v-if="closable"
        size="sm"
        :label="`移除 ${item.name}`"
        @click="emits('remove', item.id)"
      />
    </span>
    <span v-if="extra > 0" class="shrink-0 text-[var(--el-text-color-secondary)]">+{{ extra }}</span>
    <span
      v-if="!members.length"
      class="truncate text-[var(--in-text-color-placeholder)]"
    >
      {{ emptyText }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { InAvatar, InCloseButton } from "@ingot/admin-core";
import { overflowCount, visibleMembers, type MemberChip } from "./memberChipOverflow";

defineOptions({ name: "BizIamMemberChips" });

const props = withDefaults(
  defineProps<{
    members: MemberChip[];
    closable?: boolean;
    emptyText?: string;
  }>(),
  {
    closable: false,
    emptyText: "请选择成员",
  },
);

const emits = defineEmits<{ remove: [id: string] }>();

const shown = computed(() => visibleMembers(props.members));
const extra = computed(() => overflowCount(props.members.length));
</script>
