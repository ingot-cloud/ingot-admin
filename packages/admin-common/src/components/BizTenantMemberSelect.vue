<template>
  <div class="w-full">
    <in-selection-field
      :items="selectedItems"
      :total="selectedTotal ?? selectedIds.length"
      :max-visible="MEMBER_CHIP_LIMIT"
      :disabled="disabled"
      :placeholder="placeholder"
      @click="privateOpen"
    >
      <template #tag-suffix="{ item }">
        <span v-if="showPrimary && item.id === primaryMemberId" class="biz-member-select__primary"
          >部门主负责人</span
        >
        <span v-if="item.available === false" class="text-12px text-[var(--el-color-warning)]"
          >不可用，待交接</span
        >
      </template>
    </in-selection-field>
    <biz-iam-member-picker-dialog
      ref="dialog"
      organization
      :multiple="multiple"
      :load-members="privateLoad"
      :load-browse="privateBrowse"
      :load-bound="loadBound"
      :show-primary="showPrimary"
      :primary-member-id="primaryMemberId"
      :restricted="restricted"
      :reset-key="resetKey"
      :title="title"
      search-placeholder="请输入姓名"
      @confirm="privateConfirm"
    />
  </div>
</template>
<script setup lang="ts">
import { computed, ref, watch, inject, onBeforeUnmount } from "vue";
import { InSelectionField, useCapabilities, type Page } from "@ingot/admin-core";
import { MEMBER_CHIP_LIMIT } from "./memberChipOverflow";
import { IAM_DEFAULT_PAGE_SIZE } from "../models/iam";
import { iamEditorFailure } from "../hooks/iamEditorFailure";
import {
  organizationMemberPickerKey,
  useOrganizationMemberScopeKey,
  OrganizationMemberScene,
  type OrganizationMemberBrowseLoader,
  type OrganizationMemberRelation,
} from "./organizationMemberPicker";
import type { IamSelectOption } from "../models/iam";
import type { MemberPickerChanges, OrganizationMemberParams } from "./organizationMemberPicker";
import BizIamMemberPickerDialog from "./BizIamMemberPickerDialog.vue";
const props = withDefaults(
  defineProps<{
    loadMembers: (params: OrganizationMemberParams) => Promise<Page<IamSelectOption>>;
    loadBrowse?: OrganizationMemberBrowseLoader;
    loadBound?: (params: OrganizationMemberParams) => Promise<Page<IamSelectOption>>;
    options?: IamSelectOption[];
    selectedTotal?: number;
    multiple?: boolean;
    disabled?: boolean;
    placeholder?: string;
    title?: string;
    showPrimary?: boolean;
    primaryMemberId?: string;
    restricted?: boolean;
    resetKey?: string | number;
    relation?: OrganizationMemberRelation;
  }>(),
  { multiple: false, placeholder: "请选择成员", title: "请选择" },
);
const context = inject(organizationMemberPickerKey, undefined);
const permissions = context ? useCapabilities() : undefined;
const scopeKey = useOrganizationMemberScopeKey(permissions);
const opening = ref(false);
let generation = 0;
const model = defineModel<string | string[]>({ default: "" });
const emits = defineEmits<{
  confirm: [
    members: IamSelectOption[],
    primary?: string,
    changes?: MemberPickerChanges,
    boundPage?: Page<IamSelectOption>,
  ];
}>();
const dialog = ref<InstanceType<typeof BizIamMemberPickerDialog>>();
const known = ref<Record<string, IamSelectOption>>({});
watch(
  () => props.options,
  (items) => {
    for (const item of items || []) known.value[item.id] = item;
  },
  { immediate: true, deep: true },
);
const selectedIds = computed(() =>
  Array.isArray(model.value) ? model.value : model.value ? [model.value] : [],
);
const selectedItems = computed<IamSelectOption[]>(() => {
  const items = selectedIds.value.map(
    (id) => known.value[id] || { id, name: "姓名待加载", labelPending: true },
  );
  if (!props.showPrimary || !props.primaryMemberId) return items;
  return items.sort(
    (left, right) =>
      Number(right.id === props.primaryMemberId) - Number(left.id === props.primaryMemberId),
  );
});
const privateLoad = async (params: OrganizationMemberParams) => {
  const current = generation;
  const result = await props.loadMembers(params);
  if (current !== generation) return { ...result, records: [] };
  for (const item of result.records || []) known.value[item.id] = item;
  return result;
};
const privateBrowse = computed<OrganizationMemberBrowseLoader | undefined>(() => {
  const loader =
    props.loadBrowse ||
    (context?.browse
      ? (params: Parameters<OrganizationMemberBrowseLoader>[0]) =>
          context.browse!({ ...params, scene: OrganizationMemberScene.MEMBER })
      : undefined);
  if (!loader) return undefined;
  return async (params) => {
    const current = generation;
    const result = await loader(params);
    if (current === generation)
      for (const item of result.members.records || []) known.value[item.id] = item;
    return result;
  };
});
const privateOpen = async () => {
  if (props.disabled || opening.value) return;
  const current = generation;
  opening.value = true;
  try {
    const missing = selectedIds.value.filter((id) => !known.value[id]);
    // 只回显首屏所需的少量草稿标签，大量已绑定记录由关联接口分页。
    if (!props.loadBound && missing.length)
      await privateLoad({
        current: 1,
        size: IAM_DEFAULT_PAGE_SIZE,
        ids: missing.slice(0, IAM_DEFAULT_PAGE_SIZE),
      });
    if (current !== generation || props.disabled) return;
    dialog.value?.show(
      props.relation ||
        selectedIds.value.map(
          (id) => known.value[id] || { id, name: "信息受限", labelPending: true },
        ),
      undefined,
      props.primaryMemberId,
    );
  } catch (error) {
    if (current === generation) await iamEditorFailure(error);
  } finally {
    if (current === generation) opening.value = false;
  }
};
const privateConfirm = (
  items: IamSelectOption[],
  primary?: string,
  changes?: MemberPickerChanges,
  boundPage?: Page<IamSelectOption>,
) => {
  for (const item of items) known.value[item.id] = item;
  model.value = props.multiple ? items.map((item) => item.id) : items[0]?.id || "";
  emits("confirm", items, primary, changes, boundPage);
};
watch([() => props.resetKey, ...(permissions ? [scopeKey] : [])], () => {
  generation++;
  known.value = {};
  opening.value = false;
  dialog.value?.hide();
});
onBeforeUnmount(() => {
  generation++;
});
</script>
<style scoped>
.biz-member-select__primary {
  flex-shrink: 0;
  padding: 0 4px;
  border-radius: 4px;
  font-size: 10px;
  line-height: 16px;
  color: var(--in-color-primary);
  background: color-mix(in srgb, var(--in-color-primary) 14%, var(--in-bg-color-surface));
}
</style>
