<template>
  <in-drawer
    v-model="open"
    :title="title"
    :padding="padding"
    :loading="loading"
    layout="pinned"
    :size="size"
    :before-close="privateOnBeforeClose"
  >
    <div class="in-detail-drawer">
      <div v-if="slots.identity" class="in-detail-drawer__identity">
        <slot name="identity" />
      </div>
      <in-biz-tabs v-model="tab" :before-change="privateOnTabChange">
        <slot />
      </in-biz-tabs>
    </div>
    <template #footer>
      <template v-if="editing">
        <in-button @click="privateOnCancel">取消</in-button>
        <in-button type="primary" :loading="saving" @in-click="privateOnSave">保存</in-button>
      </template>
      <in-button v-else type="primary" @click="privateOnEdit">{{ editLabel }}</in-button>
    </template>
  </in-drawer>
</template>
<script lang="ts" setup>
import type { InBizTabsBeforeChange } from "../tabs/types";
import { confirmUnsavedChanges } from "@/hooks/components/useDetailEditSession";
import InDrawer from "./InDrawer.vue";
import InBizTabs from "../tabs/InBizTabs.vue";
import InButton from "../button/InButton.vue";

defineOptions({
  name: "InDetailDrawer",
});

const open = defineModel<boolean>({ required: true });
const tab = defineModel<string>("tab", { required: true });
const editing = defineModel<boolean>("editing", { default: false });

const props = withDefaults(
  defineProps<{
    title: string;
    editLabel?: string;
    saving?: boolean;
    loading?: unknown;
    size?: string | number;
    padding?: string;
  }>(),
  {
    editLabel: "编辑",
    padding: "0",
    size: "var(--in-drawer-width-detail)",
  },
);

const emits = defineEmits<{
  edit: [];
  cancel: [];
  save: [];
}>();

const slots = defineSlots<{
  default?: () => unknown;
  identity?: () => unknown;
}>();

const privateLeaveEdit = (): void => {
  editing.value = false;
  emits("cancel");
};

const privateOnBeforeClose = async (done: () => void): Promise<void> => {
  if (!editing.value) {
    done();
    return;
  }
  const allowed = await confirmUnsavedChanges();
  if (!allowed) {
    return;
  }
  privateLeaveEdit();
  done();
};

const privateOnTabChange: InBizTabsBeforeChange = async () => {
  if (!editing.value) {
    return true;
  }
  const allowed = await confirmUnsavedChanges();
  if (!allowed) {
    return false;
  }
  privateLeaveEdit();
  return true;
};

const privateOnEdit = (): void => {
  editing.value = true;
  emits("edit");
};

const privateOnCancel = (): void => {
  privateLeaveEdit();
};

const privateOnSave = (): void => {
  emits("save");
};
</script>
<style lang="postcss" scoped>
.in-detail-drawer {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.in-detail-drawer__identity {
  flex: none;
}
</style>
