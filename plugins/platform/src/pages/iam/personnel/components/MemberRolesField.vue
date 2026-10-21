<template>
  <div class="w-full flex flex-col gap-8px">
    <in-selection-field
      v-if="editing && editable"
      :items="draftItems"
      :show-avatar="false"
      placeholder="请选择角色并设置范围"
      @click="privatePick"
    />
    <in-loading v-else :loading="loading">
      <div v-for="role in bound" :key="role.roleRevisionRef.id" class="py-4px">
        {{ role.name }} · {{ assignmentVersionLabel(role) }}
        <span
          v-if="role.sourceTypes.includes(SubjectType.GROUP)"
          class="text-12px text-[var(--el-text-color-secondary)]"
          >（含用户组继承，只读）</span
        >
      </div>
      <div v-if="!loading && !bound.length" class="text-[var(--el-text-color-secondary)]">
        {{ failed ? "角色加载失败，请重试" : "暂无关联角色" }}
      </div>
      <in-button v-if="failed" link @in-click="privateLoad(page)">重试</in-button>
      <el-pagination
        v-if="total > IAM_DEFAULT_PAGE_SIZE"
        :current-page="page"
        :page-size="IAM_DEFAULT_PAGE_SIZE"
        :total="total"
        layout="prev, pager, next"
        size="small"
        @current-change="privateLoad"
      />
    </in-loading>
    <div v-if="editing && editable" class="text-12px text-[var(--el-text-color-secondary)]">
      {{
        hasChanges
          ? "角色配置已更新，保存成员后生效。"
          : "用户组继承、委派来源只读；角色调整与成员资料一起保存。"
      }}
    </div>
    <member-role-assign-dialog
      ref="picker"
      :member-id="memberId"
      :can-add="canAdd"
      :can-update="canUpdate"
      :can-remove="canRemove"
      @confirm="privateConfirm"
    />
  </div>
</template>
<script setup lang="ts">
import { InSelectionField, type InSelectionItem } from "@ingot/admin-core";
import { assignmentVersionLabel } from "@ingot/admin-common";
import { IAM_DEFAULT_PAGE_SIZE, SubjectType, type MemberBoundRole } from "@ingot/admin-common";
import { PlatformMemberBoundRolesAPI } from "@/api/iam/personnel";
import {
  hasMemberRoleChanges,
  memberRoleChanges,
  memberRoleLabel,
  type MemberRoleEditorState,
} from "../memberRoleEditor";
import MemberRoleAssignDialog from "./MemberRoleAssignDialog.vue";

defineOptions({ name: "MemberRolesField" });
const props = defineProps<{
  memberId?: string;
  editing: boolean;
  editable: boolean;
  canAdd: boolean;
  canUpdate?: boolean;
  canRemove?: boolean;
}>();
const draft = defineModel<MemberRoleEditorState | undefined>("draft");
const picker = ref<InstanceType<typeof MemberRoleAssignDialog>>();
const bound = ref<MemberBoundRole[]>([]);
const total = ref(0);
const page = ref(1);
const loading = ref(false);
const failed = ref(false);
let epoch = 0;
const hasChanges = computed(
  () => draft.value && hasMemberRoleChanges(memberRoleChanges(draft.value)),
);
const draftItems = computed<InSelectionItem[]>(() => {
  if (!draft.value)
    return bound.value.map((role, index) => ({
      id: `bound:${index}:${role.roleRevisionRef.id}`,
      name: `${role.name} · ${assignmentVersionLabel(role)}`,
    }));
  const items: InSelectionItem[] = draft.value.stored
    .filter((row) => !draft.value!.removed.includes(row.record.id))
    .map((row) => ({
      id: `stored:${row.record.id}`,
      name: `${row.record.roleName} · ${assignmentVersionLabel(row.record)}`,
    }));
  items.push(
    ...draft.value.roles
      .filter((role) => !role.configurationKey)
      .map((role, index) => ({
        id: `new:${index}:${role.option.id}`,
        name: memberRoleLabel(role.option),
      })),
  );
  return items;
});
const privateConfirm = (state: MemberRoleEditorState): void => {
  draft.value = state;
};
const privatePick = (): void => {
  if (props.editable) picker.value?.show(draft.value);
};
const privateLoad = async (next = 1): Promise<void> => {
  page.value = next;
  if (!props.memberId) return;
  const current = ++epoch;
  loading.value = true;
  failed.value = false;
  try {
    const response = await PlatformMemberBoundRolesAPI(props.memberId, {
      current: next,
      size: IAM_DEFAULT_PAGE_SIZE,
    });
    if (current !== epoch) return;
    bound.value = response.data.records || [];
    total.value = response.data.total || 0;
  } catch {
    if (current === epoch) {
      bound.value = [];
      failed.value = true;
    }
  } finally {
    if (current === epoch) loading.value = false;
  }
};
watch(
  () => props.memberId,
  () => {
    epoch += 1;
    bound.value = [];
    total.value = 0;
    void privateLoad();
  },
  { immediate: true },
);
onBeforeUnmount(() => {
  epoch += 1;
});
defineExpose({ refresh: () => privateLoad(page.value) });
</script>
