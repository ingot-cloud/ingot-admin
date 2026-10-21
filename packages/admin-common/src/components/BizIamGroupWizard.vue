<template>
  <in-drawer
    v-model="visible"
    :title="title"
    size="100%"
    layout="pinned"
    close-position="start"
    :loading="loading"
    :before-close="privateOnBeforeClose"
  >
    <div class="in-wizard-frame h-full min-h-0 flex flex-col">
      <el-steps
        :active="step"
        finish-status="success"
        align-center
        class="iam-group-wizard__steps shrink-0 mb-32px"
      >
        <el-step title="填写基本信息" />
        <el-step title="设置用户组成员" />
        <el-step title="检查并保存" />
      </el-steps>
      <div class="flex-1 min-h-0 overflow-auto">
        <div class="mx-auto w-full max-w-640px">
        <in-form v-if="step === 0" label-position="top">
          <el-form-item label="用户组名称" required>
            <el-input v-model="draft.name" clearable placeholder="请输入用户组名称" />
          </el-form-item>
          <el-form-item label="用户组描述">
            <el-input
              v-model="draft.description"
              type="textarea"
              :rows="3"
              placeholder="请输入用户组描述"
            />
          </el-form-item>
        </in-form>
        <in-form v-else-if="step === 1" label-position="top">
          <el-form-item label="添加成员">
            <in-selection-field
              :items="draft.members"
              :total="draft.memberIds.length"
              :max-visible="MEMBER_CHIP_LIMIT"
              closable
              placeholder="请选择成员"
              @click="privateOpenPicker"
              @remove="privateRemoveMember($event.id)"
            />
          </el-form-item>
          <el-form-item v-if="allowDepartments" label="部门来源">
            <slot
              name="departments"
              :departments="draft.departments"
              :change="privateSetDepartments"
            >
              <div v-if="loadDepartments" class="flex w-full flex-col gap-8px">
                <div
                  v-for="(item, index) in draft.departments"
                  :key="item.id"
                  class="flex items-center gap-8px"
                >
                  <in-selection-tag
                    :name="item.name || item.id"
                    :show-avatar="false"
                    closable
                    @close="privateRemoveDepartment(index)"
                  />
                  <el-checkbox v-model="item.includeDescendants" @change="privateTouchDepartment">
                    含下级
                  </el-checkbox>
                </div>
                <span
                  v-if="!draft.departments.length"
                  class="text-[var(--el-text-color-secondary)]"
                >
                  未选择部门
                </span>
                <in-page-select
                  v-model="departmentPick"
                  filterable
                  remote
                  clearable
                  value-field="id"
                  label-field="name"
                  placeholder="请选择部门"
                  :page-size="IAM_DEFAULT_PAGE_SIZE"
                  :load-data="privateLoadDepartments"
                  @change="privateAddDepartment"
                />
              </div>
            </slot>
          </el-form-item>
        </in-form>
        <div v-else class="flex flex-col gap-24px">
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
          <section>
            <div class="mb-12px font-500">基本信息</div>
            <div class="bg-[var(--in-bg-color-page)] rounded-8px p-16px flex flex-col gap-12px">
              <div>
                <div class="text-12px text-[var(--el-text-color-secondary)]">用户组名称</div>
                <div>{{ draft.name.trim() || "-" }}</div>
              </div>
              <div>
                <div class="text-12px text-[var(--el-text-color-secondary)]">用户组描述</div>
                <div>{{ draft.description.trim() || "-" }}</div>
              </div>
            </div>
          </section>
          <section>
            <div class="mb-12px font-500">用户组成员</div>
            <div class="bg-[var(--in-bg-color-page)] rounded-8px p-16px">
              <biz-iam-member-chips :members="draft.members" :total="draft.memberIds.length" />
            </div>
          </section>
          <section v-if="allowDepartments">
            <div class="mb-12px font-500">部门来源</div>
            <div class="bg-[var(--in-bg-color-page)] rounded-8px p-16px">
              {{ departmentSummary }}
            </div>
          </section>
        </div>
        </div>
      </div>
    </div>
    <template #footer>
      <in-button @in-click="privateCancel">取消</in-button>
      <in-button v-if="step > 0" @in-click="privateBack">上一步</in-button>
      <in-button v-if="step < 2" type="primary" @in-click="privateNext">下一步</in-button>
      <in-button
        v-else
        type="primary"
        :loading="loading"
        :disabled="editing ? !preview?.valid : false"
        @in-click="privateSubmit"
      >
        完成
      </in-button>
    </template>
  </in-drawer>
  <biz-iam-member-picker-dialog
    ref="pickerRef"
    :organization="organization"
    :load-members="loadMembers"
    :load-bound="pickerLoadBound"
    :load-browse="loadBrowse"
    @confirm="privateOnPicked"
  />
</template>

<script setup lang="ts">
import {
  confirmUnsavedChanges,
  InSelectionField,
  InSelectionTag,
  Message,
  type LoadDataParams,
  type Page,
  type R,
} from "@ingot/admin-core";
import BizIamMemberChips from "./BizIamMemberChips.vue";
import BizIamMemberPickerDialog from "./BizIamMemberPickerDialog.vue";
import BizIamPreviewAlert from "./BizIamPreviewAlert.vue";
import { emptySelectionDepartments, IAM_DEFAULT_PAGE_SIZE } from "../models/iam";
import { MEMBER_CHIP_LIMIT } from "./memberChipOverflow";
import type { OrganizationMemberBrowseLoader } from "./organizationMemberPicker";
import type {
  CreatedResource,
  GroupDraft,
  GroupRecord,
  GroupUpdateInput,
  IamSelectOption,
  Preview,
  ReferenceImpactPreview,
  ResourceDetail,
} from "../models/iam";

interface WizardDepartment {
  id: string;
  name: string;
  includeDescendants: boolean;
}

defineOptions({ name: "BizIamGroupWizard" });

const props = withDefaults(
  defineProps<{
    loadMembers: (params: LoadDataParams) => Promise<Page<IamSelectOption>>;
    loadBound: (params: LoadDataParams & { groupId: string }) => Promise<Page<IamSelectOption>>;
    createApi: (draft: GroupDraft) => Promise<R<CreatedResource>>;
    getApi: (id: string) => Promise<R<ResourceDetail<GroupRecord>>>;
    updateApi: (id: string, input: GroupUpdateInput) => Promise<R<ResourceDetail<GroupRecord>>>;
    previewApi: (id: string, input: GroupUpdateInput) => Promise<R<Preview<ReferenceImpactPreview>>>;
    organization?: boolean;
    loadBrowse?: OrganizationMemberBrowseLoader;
    allowDepartments?: boolean;
    loadDepartments?: (params: LoadDataParams) => Promise<Page<IamSelectOption>>;
  }>(),
  {
    organization: false,
    allowDepartments: false,
  },
);

const emits = defineEmits<{ success: [] }>();

const visible = ref(false);
const loading = ref(false);
const step = ref(0);
const editing = ref<ResourceDetail<GroupRecord>>();
const preview = ref<Preview<ReferenceImpactPreview> | null>(null);
const pickerRef = ref<{ show: (current?: IamSelectOption[] | { boundIds: string[] }) => void }>();
const draft = reactive({
  name: "",
  description: "",
  members: [] as IamSelectOption[],
  memberIds: [] as string[],
  departments: [] as WizardDepartment[],
});
const departmentPick = ref("");
const departmentLabels = reactive<Record<string, string>>({});

const title = computed(() => (editing.value ? "编辑用户组" : "新建用户组"));
const impact = computed(() => preview.value?.effectiveResult);
const departmentSummary = computed(() => {
  if (!draft.departments.length) {
    return "未设置";
  }
  return draft.departments
    .map((item) => {
      const name = item.name || item.id;
      return item.includeDescendants ? `${name}（含下级）` : name;
    })
    .join("、");
});
const snapshot = (): string =>
  JSON.stringify({
    name: draft.name.trim(),
    description: draft.description.trim(),
    members: draft.memberIds,
    departments: draft.departments.map((item) => ({
      id: item.id,
      includeDescendants: item.includeDescendants,
    })),
  });
const initial = ref(snapshot());
const dirty = computed(() => snapshot() !== initial.value);

const asDraft = (): GroupDraft => ({
  name: draft.name.trim(),
  description: draft.description.trim() || undefined,
  selection: {
    members: draft.memberIds,
    departments: props.allowDepartments
      ? draft.departments.map((item) => ({
          id: item.id,
          includeDescendants: item.includeDescendants,
        }))
      : emptySelectionDepartments(),
  },
});

const reset = (): void => {
  step.value = 0;
  editing.value = undefined;
  preview.value = null;
  draft.name = "";
  draft.description = "";
  draft.members = [];
  draft.memberIds = [];
  draft.departments = [];
  departmentPick.value = "";
  for (const key of Object.keys(departmentLabels)) {
    delete departmentLabels[key];
  }
  loading.value = false;
  initial.value = snapshot();
};

const privateOnBeforeClose = (done: () => void): void => {
  if (!dirty.value) {
    done();
    return;
  }
  void confirmUnsavedChanges().then((allowed) => {
    if (allowed) {
      done();
    }
  });
};

const privateCancel = (): void => {
  privateOnBeforeClose(() => {
    visible.value = false;
  });
};

const pickerLoadBound = (params: LoadDataParams): Promise<Page<IamSelectOption>> => {
  const groupId = editing.value?.record.id;
  if (!groupId) {
    return Promise.resolve({ records: [], total: 0, current: 1, size: params.size });
  }
  return props.loadBound({ ...params, groupId });
};

const privateOpenPicker = (): void => {
  if (editing.value) {
    pickerRef.value?.show({ boundIds: draft.memberIds });
    return;
  }
  pickerRef.value?.show(draft.members);
};

const privateOnPicked = (members: IamSelectOption[]): void => {
  draft.memberIds = members.map((item) => item.id);
  draft.members = members;
  preview.value = null;
};

const privateRemoveMember = (id: string): void => {
  draft.memberIds = draft.memberIds.filter((item) => item !== id);
  draft.members = draft.members.filter((item) => item.id !== id);
  preview.value = null;
};

const privateLoadDepartments = async (params: LoadDataParams): Promise<Page<IamSelectOption>> => {
  if (!props.loadDepartments) {
    return { current: 1, size: IAM_DEFAULT_PAGE_SIZE, total: 0, records: [] };
  }
  const page = await props.loadDepartments(params);
  for (const item of page.records ?? []) {
    departmentLabels[item.id] = item.name;
  }
  return page;
};

const privateTouchDepartment = (): void => {
  preview.value = null;
};

const privateSetDepartments = (departments: WizardDepartment[]): void => {
  draft.departments = departments.map((item) => ({
    id: item.id,
    name: item.name,
    includeDescendants: item.includeDescendants,
  }));
  preview.value = null;
};

const privateAddDepartment = (value: string): void => {
  if (value && !draft.departments.some((item) => item.id === value)) {
    draft.departments.push({
      id: value,
      name: departmentLabels[value] ?? "",
      includeDescendants: true,
    });
  }
  departmentPick.value = "";
  preview.value = null;
};

const privateRemoveDepartment = (index: number): void => {
  draft.departments.splice(index, 1);
  preview.value = null;
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

const privateBack = (): void => {
  step.value = Math.max(0, step.value - 1);
};

const privateNext = (): void => {
  if (step.value === 0 && !draft.name.trim()) {
    Message.warning("请输入用户组名称");
    return;
  }
  if (step.value === 1 && editing.value) {
    step.value = 2;
    privatePreview();
    return;
  }
  step.value = Math.min(2, step.value + 1);
};

const privateSubmit = (): void => {
  if (!draft.name.trim()) {
    Message.warning("请输入用户组名称");
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
    reset();
    visible.value = true;
    if (!row) {
      return;
    }
    loading.value = true;
    props
      .getApi(row.record.id)
      .then(async (response) => {
        editing.value = response.data;
        draft.name = response.data.record.name;
        draft.description = response.data.record.description ?? "";
        draft.memberIds = [...response.data.record.selection.members];
        draft.departments = response.data.record.selection.departments.map((item) => ({
          id: item.id,
          name: "",
          includeDescendants: item.includeDescendants === true,
        }));
        const bound = await props.loadBound({
          current: 1,
          size: MEMBER_CHIP_LIMIT,
          groupId: response.data.record.id,
        });
        draft.members = bound.records ?? [];
        initial.value = snapshot();
      })
      .finally(() => {
        loading.value = false;
      });
  },
});
</script>
<style lang="postcss" scoped>
.iam-group-wizard__steps {
  --el-color-success: var(--in-color-primary);
}
</style>
