<template>
  <member-department-field
    :model-value="views"
    placeholder="请选择部门"
    @update:model-value="privateOnViews"
  >
    <template #tag-suffix="{ item }">
      <el-checkbox
        class="group-dept-field__descendant"
        :model-value="includeDescendantsOf(item.id)"
        @change="privateToggleDescendants(item.id, $event)"
      >
        含下级
      </el-checkbox>
    </template>
  </member-department-field>
</template>

<script setup lang="ts">
import type { CheckboxValueType } from "element-plus";
import type { MemberDepartmentView } from "@ingot/admin-common";
import { TenantDepartmentTreeAPI } from "@/api/iam/directory";
import MemberDepartmentField from "../../members/components/MemberDepartmentField.vue";
import { flattenDepartmentChoices } from "../../members/departmentSelection";
import { nestRootDepartmentChildren, toMemberDeptNode } from "../../members/deptTree";

defineOptions({ name: "GroupDepartmentField" });

export interface GroupDepartmentDraft {
  id: string;
  name: string;
  includeDescendants: boolean;
}

const props = withDefaults(
  defineProps<{
    /** 新勾选部门是否默认包含下级。已有部门保持原值。 */
    defaultIncludeDescendants?: boolean;
  }>(),
  { defaultIncludeDescendants: true },
);

const model = defineModel<GroupDepartmentDraft[]>({ required: true });

const views = computed<MemberDepartmentView[]>(() =>
  model.value.map((item, index) => ({
    id: item.id,
    name: item.name || item.id,
    primary: index === 0,
  })),
);

const includeDescendantsOf = (id: string): boolean =>
  model.value.find((item) => item.id === id)?.includeDescendants === true;

const privateOnViews = (value: MemberDepartmentView[]): void => {
  const previous = new Map(model.value.map((item) => [item.id, item]));
  model.value = value.map((item) => ({
    id: item.id,
    name: item.name,
    includeDescendants: previous.get(item.id)?.includeDescendants ?? props.defaultIncludeDescendants,
  }));
};

const privateToggleDescendants = (id: string, value: CheckboxValueType): void => {
  const includeDescendants = value === true;
  model.value = model.value.map((item) =>
    item.id === id ? { ...item, includeDescendants } : item,
  );
};

const privateFillNames = (): void => {
  const missing = model.value.some((item) => !item.name.trim());
  if (!missing) {
    return;
  }
  TenantDepartmentTreeAPI()
    .then((response) => {
      const names = new Map(
        flattenDepartmentChoices(
          nestRootDepartmentChildren((response.data ?? []).map(toMemberDeptNode)),
        ).map((item) => [item.id, item.name]),
      );
      const current = model.value;
      if (!current.some((item) => !item.name.trim())) {
        return;
      }
      model.value = current.map((item) => ({
        ...item,
        name: item.name.trim() || names.get(item.id) || item.id,
      }));
    })
    .catch(() => undefined);
};

watch(() => model.value.map((item) => item.id).join("\0"), privateFillNames, { immediate: true });
</script>

<style scoped lang="postcss">
.group-dept-field__descendant {
  height: 16px;
  margin-right: 0;
}

.group-dept-field__descendant :deep(.el-checkbox__label) {
  padding-left: 4px;
  font-size: 12px;
  line-height: 16px;
}
</style>
