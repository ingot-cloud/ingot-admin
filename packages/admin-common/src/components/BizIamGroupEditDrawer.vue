<template>
  <in-drawer :title="title" v-model="visible" :loading="loading" size="560px">
    <in-form label-position="top">
      <el-form-item label="名称" required>
        <el-input v-model="draft.name" placeholder="请输入组名称" />
      </el-form-item>
      <el-form-item label="说明">
        <el-input v-model="draft.description" type="textarea" :rows="2" placeholder="请输入说明" />
      </el-form-item>
      <el-form-item label="成员">
        <div class="flex flex-col gap-8px">
          <div class="flex flex-wrap gap-8px">
            <el-tag
              v-for="id in draft.memberIds"
              :key="id"
              closable
              @close="privateRemoveMember(id)"
            >
              {{ id }}
            </el-tag>
            <span v-if="!draft.memberIds.length" class="text-[var(--el-text-color-secondary)]">未选择成员</span>
          </div>
          <in-page-select
            v-model="memberPick"
            filterable
            remote
            clearable
            value-field="id"
            label-field="name"
            placeholder="远程分页添加有效成员"
            :load-data="loadMembers"
            @change="privateAddMember"
          />
        </div>
      </el-form-item>
      <el-form-item v-if="allowDepartments && loadDepartments" label="部门来源">
        <div class="flex flex-col gap-8px">
          <div class="flex flex-wrap gap-8px">
            <el-tag
              v-for="id in draft.departmentIds"
              :key="id"
              closable
              @close="privateRemoveDepartment(id)"
            >
              {{ id }}
            </el-tag>
            <span v-if="!draft.departmentIds.length" class="text-[var(--el-text-color-secondary)]">未选择部门</span>
          </div>
          <in-page-select
            v-model="departmentPick"
            filterable
            remote
            clearable
            value-field="id"
            label-field="name"
            placeholder="远程分页添加部门"
            :load-data="loadDepartments"
            @change="privateAddDepartment"
          />
          <el-checkbox v-model="draft.includeDescendants">含下级部门</el-checkbox>
        </div>
      </el-form-item>
      <el-form-item v-if="editing" label="有效成员">
        <span v-if="editing.record.visibleMemberCount != null">
          有权范围内 {{ editing.record.visibleMemberCount }} 人（去重后）
        </span>
        <span v-else class="text-[var(--el-text-color-secondary)]">当前身份无法披露人数，不以 0 代替</span>
      </el-form-item>
      <biz-iam-preview-alert v-if="preview" :preview="preview" />
      <div v-if="impact" class="text-12px text-[var(--el-text-color-secondary)] flex flex-col gap-4px">
        <div v-if="impact.impactSummary.affectedMembers != null">
          可披露受影响成员 {{ impact.impactSummary.affectedMembers }}
        </div>
        <div v-if="impact.impactSummary.affectedAssignments != null">
          可披露受影响授权 {{ impact.impactSummary.affectedAssignments }}
        </div>
        <div v-if="impact.impactSummary.affectedDelegations != null">
          可披露受影响委派 {{ impact.impactSummary.affectedDelegations }}
        </div>
        <div v-if="impact.affectedAssignmentIds.length">
          引用授权：{{ impact.affectedAssignmentIds.join("、") }}
        </div>
        <div v-if="impact.impactSummary.restricted">另有无法披露的引用，不以 0 代替。</div>
      </div>
    </in-form>
    <template #footer>
      <in-button @click="visible = false">取消</in-button>
      <in-button v-if="editing" @click="privatePreview">预览影响</in-button>
      <in-button type="primary" :loading="loading" :disabled="editing ? !preview?.valid : false" @in-click="privateSubmit">
        保存
      </in-button>
    </template>
  </in-drawer>
</template>

<script setup lang="ts">
import { Message, type LoadDataParams, type Page, type R } from "@ingot/admin-core";
import {
  emptySelectionDepartments,
  type CreatedResource,
  type GroupDraft,
  type GroupRecord,
  type GroupUpdateInput,
  type IamSelectOption,
  type Preview,
  type ReferenceImpactPreview,
  type ResourceDetail,
} from "../models/iam";

defineOptions({ name: "BizIamGroupEditDrawer" });

const props = withDefaults(
  defineProps<{
    allowDepartments?: boolean;
    loadMembers: (params: LoadDataParams) => Promise<Page<IamSelectOption>>;
    loadDepartments?: (params: LoadDataParams) => Promise<Page<IamSelectOption>>;
    createApi: (draft: GroupDraft) => Promise<R<CreatedResource>>;
    getApi: (id: string) => Promise<R<ResourceDetail<GroupRecord>>>;
    updateApi: (id: string, input: GroupUpdateInput) => Promise<R<ResourceDetail<GroupRecord>>>;
    previewApi: (id: string, input: GroupUpdateInput) => Promise<R<Preview<ReferenceImpactPreview>>>;
  }>(),
  {
    allowDepartments: false,
  },
);

const emits = defineEmits<{ success: [] }>();
const visible = ref(false);
const loading = ref(false);
const editing = ref<ResourceDetail<GroupRecord>>();
const preview = ref<Preview<ReferenceImpactPreview> | null>(null);
const impact = computed(() => preview.value?.effectiveResult);
const draft = reactive({
  name: "",
  description: "",
  memberIds: [] as string[],
  departmentIds: [] as string[],
  includeDescendants: true,
});
const memberPick = ref("");
const departmentPick = ref("");

const title = computed(() => (editing.value ? "编辑组" : "创建组"));

watch(draft, () => {
  preview.value = null;
}, { deep: true });

const asDraft = (): GroupDraft => ({
  name: draft.name.trim(),
  description: draft.description.trim() || undefined,
  selection: {
    members: [...draft.memberIds],
    departments: props.allowDepartments
      ? draft.departmentIds.map((id) => ({
          id,
          includeDescendants: draft.includeDescendants,
        }))
      : emptySelectionDepartments(),
  },
});

const privateAddMember = (value: string): void => {
  if (value && !draft.memberIds.includes(value)) {
    draft.memberIds = [...draft.memberIds, value];
  }
  memberPick.value = "";
};

const privateRemoveMember = (id: string): void => {
  draft.memberIds = draft.memberIds.filter((item) => item !== id);
};

const privateAddDepartment = (value: string): void => {
  if (value && !draft.departmentIds.includes(value)) {
    draft.departmentIds = [...draft.departmentIds, value];
  }
  departmentPick.value = "";
};

const privateRemoveDepartment = (id: string): void => {
  draft.departmentIds = draft.departmentIds.filter((item) => item !== id);
};

const privatePreview = (): void => {
  if (!editing.value) {
    return;
  }
  loading.value = true;
  props
    .previewApi(editing.value.record.id, {
      expectedVersion: editing.value.version,
      group: asDraft(),
    })
    .then((response) => {
      preview.value = response.data;
    })
    .finally(() => {
      loading.value = false;
    });
};

const privateSubmit = (): void => {
  if (!draft.name.trim()) {
    Message.warning("请输入组名");
    return;
  }
  loading.value = true;
  const done = (): void => {
    Message.success("保存成功");
    visible.value = false;
    emits("success");
  };
  if (editing.value) {
    if (!preview.value?.valid) {
      loading.value = false;
      Message.warning("请先预览且预览通过后再提交");
      return;
    }
    props
      .updateApi(editing.value.record.id, {
        expectedVersion: editing.value.version,
        group: asDraft(),
      })
      .then(done)
      .finally(() => {
        loading.value = false;
      });
    return;
  }
  props
    .createApi(asDraft())
    .then(done)
    .finally(() => {
      loading.value = false;
    });
};

defineExpose({
  show(row?: ResourceDetail<GroupRecord>) {
    preview.value = null;
    visible.value = true;
    if (!row) {
      editing.value = undefined;
      draft.name = "";
      draft.description = "";
      draft.memberIds = [];
      draft.departmentIds = [];
      draft.includeDescendants = true;
      return;
    }
    loading.value = true;
    props
      .getApi(row.record.id)
      .then((response) => {
        editing.value = response.data;
        draft.name = response.data.record.name;
        draft.description = response.data.record.description ?? "";
        draft.memberIds = [...response.data.record.selection.members];
        draft.departmentIds = response.data.record.selection.departments.map((item) => item.id);
        draft.includeDescendants = response.data.record.selection.departments.some(
          (item) => item.includeDescendants !== false,
        );
      })
      .finally(() => {
        loading.value = false;
      });
  },
});
</script>
