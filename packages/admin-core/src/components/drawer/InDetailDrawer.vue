<template>
  <in-drawer
    v-model="open"
    :title="title"
    :padding="padding"
    layout="pinned"
    :size="size"
    :before-close="privateOnBeforeClose"
  >
    <div class="in-detail-drawer">
      <in-form-skeleton v-if="isLoading" />
      <div v-show="!isLoading" class="in-detail-drawer__loaded">
        <div v-if="slots.identity" class="in-detail-drawer__identity">
          <slot name="identity" />
        </div>
        <in-biz-tabs
          v-model="tab"
          :align-content="alignContent"
          :content-padding="contentPadding"
          :before-change="privateOnTabChange"
        >
          <slot />
        </in-biz-tabs>
      </div>
    </div>
    <template v-if="showFooter" #footer>
      <template v-if="editing">
        <in-button @in-click="privateOnCancel">取消</in-button>
        <in-button type="primary" :loading="saving" @in-click="privateOnSave">保存</in-button>
      </template>
      <in-button v-else type="primary" @in-click="privateOnEdit">{{ editLabel }}</in-button>
    </template>
  </in-drawer>
</template>
<script lang="ts" setup>
import type { InBizTabsBeforeChange } from "../tabs/types";
import { detailDrawerTabsKey } from "../tabs/constants";
import { confirmUnsavedChanges } from "@/hooks/components/useDetailEditSession";
import InDrawer from "./InDrawer.vue";
import InBizTabs from "../tabs/InBizTabs.vue";
import InButton from "../button/InButton.vue";
import InFormSkeleton from "../form/InFormSkeleton.vue";

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
    alignContent?: boolean;
    contentPadding?: string;
  }>(),
  {
    editLabel: "编辑",
    padding: "0",
    size: "var(--in-drawer-width-detail)",
    alignContent: true,
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

const paneEditable = reactive(new Map<string, boolean>());
const paneEditableStop = new Map<string, () => void>();
const isLoading = computed(() => Boolean(unref(props.loading)));

provide(detailDrawerTabsKey, {
  registerEditable(name, editable) {
    paneEditableStop.get(name)?.();
    paneEditableStop.set(
      name,
      watch(
        editable,
        (value) => {
          paneEditable.set(name, value);
        },
        { immediate: true },
      ),
    );
  },
  unregisterEditable(name) {
    paneEditableStop.get(name)?.();
    paneEditableStop.delete(name);
    paneEditable.delete(name);
  },
});

const currentTabEditable = computed(() => paneEditable.get(tab.value) !== false);
const showFooter = computed(
  () => !isLoading.value && (editing.value || currentTabEditable.value),
);

onUnmounted(() => {
  for (const stop of paneEditableStop.values()) {
    stop();
  }
  paneEditableStop.clear();
  paneEditable.clear();
});

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
  overflow: hidden;
}

.in-detail-drawer__loaded {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.in-detail-drawer__identity {
  flex: none;
}
</style>

<style lang="postcss">
.in-drawer.in-drawer--pinned .in-drawer__body:has(.in-detail-drawer),
.in-drawer.in-drawer--pinned .in-drawer__body:has(.in-wizard-frame) {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.in-drawer.in-drawer--pinned .in-drawer__body:has(.in-detail-drawer) > .in-loading,
.in-drawer.in-drawer--pinned .in-drawer__body:has(.in-wizard-frame) > .in-loading {
  flex: 1 1 auto !important;
  min-height: 0 !important;
  height: 100%;
}

.in-wizard-frame {
  flex: 1;
  min-height: 0;
  width: 100%;
}
</style>
