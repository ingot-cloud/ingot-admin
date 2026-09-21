<template>
  <el-tooltip
    :disabled="!tooltip"
    :content="tooltip"
    effect="dark"
    placement="top"
  >
    <span class="inline-flex min-w-0 max-w-full">
      <in-button
        v-if="access.visible"
        text
        link
        :disabled="!access.allowed"
        @click="privateOnClick"
      >
        <slot />
      </in-button>
      <span v-else class="min-w-0 truncate">
        <slot />
      </span>
    </span>
  </el-tooltip>
</template>

<script lang="ts" setup>
import { resolveIamActionAccess, type ObjectCapabilities } from "../models/iam";
import { useCapabilities } from "@ingot/admin-core";

defineOptions({ name: "BizIamRecordLink" });

const props = defineProps<{
  action: string;
  capabilities?: ObjectCapabilities;
}>();

const emit = defineEmits<{
  click: [];
}>();

const { hasAction } = useCapabilities();

const access = computed(() =>
  resolveIamActionAccess(props.action, {
    hasAction: hasAction(props.action),
    capabilities: props.capabilities,
  }),
);

const tooltip = computed(() =>
  access.value.visible && !access.value.allowed ? access.value.message : undefined,
);

const privateOnClick = (): void => {
  if (!access.value.visible || !access.value.allowed) {
    return;
  }
  emit("click");
};
</script>
