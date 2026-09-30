<template>
  <div class="flex flex-col gap-12px w-full">
    <div v-for="field in fields" :key="field.kind" class="flex flex-col gap-6px">
      <span class="text-[var(--el-text-color-regular)]">{{ field.label }}</span>
      <div
        role="button"
        :aria-label="`请选择${field.label}`"
        :aria-disabled="disabled"
        :tabindex="disabled ? -1 : 0"
        class="flex items-center gap-8px box-border w-full h-[var(--in-control-height)] px-11px border border-solid border-[var(--el-border-color)] rounded-[var(--el-border-radius-base)] bg-[var(--el-fill-color-blank)] outline-none"
        :class="
          disabled
            ? 'cursor-not-allowed opacity-60'
            : 'cursor-pointer hover:border-[var(--el-color-primary)] focus-visible:border-[var(--el-color-primary)]'
        "
        @click="privateOpen(field.kind)"
        @keydown.enter.prevent="privateOpen(field.kind)"
        @keydown.space.prevent="privateOpen(field.kind)"
      >
        <biz-iam-member-chips
          class="flex-1 min-w-0"
          :members="field.kind === 'MEMBER' ? members : groups"
          :closable="!disabled"
          :show-avatar="field.kind === 'MEMBER'"
          :empty-text="`请选择${field.label}`"
          @remove="privateRemove(field.kind, $event)"
        />
        <in-icon name="ep:edit" class="shrink-0 text-[var(--el-text-color-secondary)]" />
      </div>
    </div>
    <span class="text-12px text-[var(--el-text-color-secondary)]">
      成员和用户组可同时选择，将为每个接收对象分配同一个角色版本。
    </span>
  </div>
  <biz-iam-member-picker-dialog
    ref="memberPicker"
    title="选择成员"
    search-placeholder="搜索成员姓名"
    :load-members="privateLoadMembers"
    @confirm="members = $event"
    @load-error="iamEditorFailure"
  />
  <biz-iam-member-picker-dialog
    ref="groupPicker"
    title="选择用户组"
    search-placeholder="搜索用户组名称"
    empty-text="暂无可选用户组"
    selected-unit="个用户组"
    :show-avatar="false"
    :load-members="privateLoadGroups"
    @confirm="groups = $event"
    @load-error="iamEditorFailure"
  />
</template>
<script setup lang="ts">
import type { LoadDataParams, Page } from "@ingot/admin-core";
import { iamEditorFailure } from "../hooks/iamEditorFailure";
import type { AuthorizationCandidatesApi, IamSelectOption } from "../models/iam";
import BizIamMemberChips from "./BizIamMemberChips.vue";
import BizIamMemberPickerDialog from "./BizIamMemberPickerDialog.vue";

defineOptions({ name: "BizIamAuthorizationRecipients" });
const props = defineProps<{
  api: AuthorizationCandidatesApi;
  delegationGrantId?: string;
  disabled?: boolean;
  resetKey: string | number;
}>();
const members = defineModel<IamSelectOption[]>("members", { default: () => [] });
const groups = defineModel<IamSelectOption[]>("groups", { default: () => [] });
const memberPicker = ref<InstanceType<typeof BizIamMemberPickerDialog>>();
const groupPicker = ref<InstanceType<typeof BizIamMemberPickerDialog>>();
const fields = [
  { kind: "MEMBER", label: "成员" },
  { kind: "GROUP", label: "用户组" },
] as const;
type RecipientKind = (typeof fields)[number]["kind"];

const privateLoad = async (
  kind: RecipientKind,
  params: LoadDataParams,
): Promise<Page<IamSelectOption>> => {
  const response = await props.api({
    kind,
    delegationGrantId: props.delegationGrantId || undefined,
    keyword: params.query,
    page: params.current,
    pageSize: params.size,
  });
  return {
    records: response.data.items.map(({ id, name }) => ({ id, name })),
    total: response.data.total,
    current: response.data.page,
    size: response.data.pageSize,
  };
};
const privateLoadMembers = (params: LoadDataParams): Promise<Page<IamSelectOption>> =>
  privateLoad("MEMBER", params);
const privateLoadGroups = (params: LoadDataParams): Promise<Page<IamSelectOption>> =>
  privateLoad("GROUP", params);
const privateOpen = (kind: RecipientKind): void => {
  if (props.disabled) return;
  if (kind === "MEMBER") memberPicker.value?.show(members.value);
  else groupPicker.value?.show(groups.value);
};
const privateRemove = (kind: RecipientKind, id: string): void => {
  if (props.disabled) return;
  if (kind === "MEMBER") members.value = members.value.filter((option) => option.id !== id);
  else groups.value = groups.value.filter((option) => option.id !== id);
};
watch(
  () => [props.delegationGrantId, props.resetKey, props.disabled],
  () => {
    memberPicker.value?.hide();
    groupPicker.value?.hide();
  },
);
</script>
