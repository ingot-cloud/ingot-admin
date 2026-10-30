<template>
  <div class="w-full flex flex-col gap-8px">
    <el-select
      :model-value="model.kind"
      class="w-full"
      placeholder="请选择目标范围"
      aria-label="目标范围"
      @change="privateKind"
    >
      <el-option
        v-for="option in TARGET_SCOPE_OPTIONS"
        :key="option.value"
        :label="option.label"
        :value="option.value"
      />
    </el-select>
    <el-checkbox
      v-if="showsDescendants"
      :model-value="model.includeDescendants"
      @change="privateDescendants"
    >
      含下级
    </el-checkbox>
    <member-department-field
      v-if="model.kind === ScopeKind.MANAGED_DEPARTMENTS"
      v-model="departmentViews"
      placeholder="请选择部门"
    />
    <biz-tenant-member-select
      v-else-if="model.kind === ScopeKind.OBJECT_SET"
      :model-value="model.memberIds"
      multiple
      :load-members="loadMembers"
      placeholder="请选择成员"
      @update:model-value="privateMembers"
    />
    <p class="target-scope__hint">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import type { CheckboxValueType } from "element-plus";
import {
  BizTenantMemberSelect,
  ScopeKind,
  type IamSelectOption,
  type MemberDepartmentView,
  type OrganizationMemberParams,
} from "@ingot/admin-common";
import type { Page } from "@ingot/admin-core";
import { TenantDepartmentTreeAPI } from "@/api/iam/directory";
import MemberDepartmentField from "../../members/components/MemberDepartmentField.vue";
import { flattenDepartmentChoices } from "../../members/departmentSelection";
import { nestRootDepartmentChildren, toMemberDeptNode } from "../../members/deptTree";
import { TARGET_SCOPE_OPTIONS, type PolicyTargetValue } from "../scope";

defineOptions({ name: "PolicyTargetScopeField" });

defineProps<{
  loadMembers: (params: OrganizationMemberParams) => Promise<Page<IamSelectOption>>;
}>();

const model = defineModel<PolicyTargetValue>({ required: true });
const names = ref<Record<string, string>>({});

const showsDescendants = computed(
  () =>
    model.value.kind === ScopeKind.MEMBER_DEPARTMENTS ||
    model.value.kind === ScopeKind.MANAGED_DEPARTMENTS,
);

const hint = computed(() => {
  if (model.value.kind === ScopeKind.SELF) {
    return "只作用于查看者自己。";
  }
  if (model.value.kind === ScopeKind.MEMBER_DEPARTMENTS) {
    return "按查看者自己的任职部门匹配。";
  }
  if (model.value.kind === ScopeKind.MANAGED_DEPARTMENTS) {
    return "只作用于所选部门中的成员。";
  }
  if (model.value.kind === ScopeKind.OBJECT_SET) {
    return "只作用于所选成员。";
  }
  return "作用于这些查看者能看到的全部对象。";
});

const departmentViews = computed<MemberDepartmentView[]>({
  get: () =>
    model.value.departmentIds.map((id) => ({
      id,
      name: names.value[id] || "",
      primary: false,
    })),
  set: (views) => {
    const nextNames = { ...names.value };
    for (const item of views) {
      if (item.name.trim()) {
        nextNames[item.id] = item.name;
      }
    }
    names.value = nextNames;
    model.value = { ...model.value, departmentIds: views.map((item) => item.id) };
  },
});

const privateFillNames = (): void => {
  const missing = model.value.departmentIds.some((id) => !names.value[id]);
  if (!missing) {
    return;
  }
  TenantDepartmentTreeAPI()
    .then((response) => {
      const catalog = new Map(
        flattenDepartmentChoices(
          nestRootDepartmentChildren((response.data ?? []).map(toMemberDeptNode)),
        ).map((item) => [item.id, item.name]),
      );
      const next = { ...names.value };
      for (const id of model.value.departmentIds) {
        next[id] = next[id] || catalog.get(id) || id;
      }
      names.value = next;
    })
    .catch(() => undefined);
};

watch(() => model.value.departmentIds.join("\0"), privateFillNames, { immediate: true });

const privateKind = (kind: ScopeKind): void => {
  model.value = {
    ...model.value,
    kind,
    includeDescendants: false,
    parameterKey: kind === model.value.kind ? model.value.parameterKey : "",
  };
};

const privateDescendants = (value: CheckboxValueType): void => {
  model.value = { ...model.value, includeDescendants: value === true };
};

const privateMembers = (value: string | string[]): void => {
  model.value = {
    ...model.value,
    memberIds: Array.isArray(value) ? [...value] : value ? [value] : [],
  };
};
</script>

<style lang="postcss" scoped>
.target-scope__hint {
  margin: 0;
  color: var(--in-text-color-secondary);
  font-size: var(--in-font-size-caption);
  line-height: var(--in-line-height-body);
}
</style>
