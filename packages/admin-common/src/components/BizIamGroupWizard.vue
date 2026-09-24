<template>
  <in-drawer
    v-model="visible"
    :title="title"
    size="100%"
    layout="pinned"
    :loading="loading"
    :before-close="privateOnBeforeClose"
  >
    <div class="h-full min-h-0 flex flex-col">
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
            <div
              class="iam-group-wizard__member-field"
              role="button"
              tabindex="0"
              @click="privateOpenPicker"
              @keydown.enter.prevent="privateOpenPicker"
            >
              <biz-iam-member-chips
                class="flex-1 min-w-0"
                :members="draft.members"
                closable
                empty-text="请选择成员"
                @remove="privateRemoveMember"
              />
              <in-icon name="ep:edit" class="shrink-0 text-[var(--el-text-color-secondary)]" />
            </div>
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
                <div>{{ draft.name.trim() || "—" }}</div>
              </div>
              <div>
                <div class="text-12px text-[var(--el-text-color-secondary)]">用户组描述</div>
                <div>{{ draft.description.trim() || "—" }}</div>
              </div>
            </div>
          </section>
          <section>
            <div class="mb-12px font-500">用户组成员</div>
            <div class="bg-[var(--in-bg-color-page)] rounded-8px p-16px">
              <biz-iam-member-chips :members="draft.members" />
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
  <biz-iam-member-picker-dialog ref="pickerRef" :load-members="loadMembers" @confirm="privateOnPicked" />
</template>

<script setup lang="ts">
import {
  confirmUnsavedChanges,
  Message,
  type LoadDataParams,
  type Page,
  type R,
} from "@ingot/admin-core";
import BizIamMemberChips from "./BizIamMemberChips.vue";
import BizIamMemberPickerDialog from "./BizIamMemberPickerDialog.vue";
import BizIamPreviewAlert from "./BizIamPreviewAlert.vue";
import { emptySelectionDepartments } from "../models/iam";
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

defineOptions({ name: "BizIamGroupWizard" });

const props = defineProps<{
  loadMembers: (params: LoadDataParams) => Promise<Page<IamSelectOption>>;
  loadSelected: (ids: string[]) => Promise<IamSelectOption[]>;
  createApi: (draft: GroupDraft) => Promise<R<CreatedResource>>;
  getApi: (id: string) => Promise<R<ResourceDetail<GroupRecord>>>;
  updateApi: (id: string, input: GroupUpdateInput) => Promise<R<ResourceDetail<GroupRecord>>>;
  previewApi: (id: string, input: GroupUpdateInput) => Promise<R<Preview<ReferenceImpactPreview>>>;
}>();

const emits = defineEmits<{ success: [] }>();

const visible = ref(false);
const loading = ref(false);
const step = ref(0);
const editing = ref<ResourceDetail<GroupRecord>>();
const preview = ref<Preview<ReferenceImpactPreview> | null>(null);
const pickerRef = ref<{ show: (current: IamSelectOption[]) => void }>();
const draft = reactive({
  name: "",
  description: "",
  members: [] as IamSelectOption[],
});

const title = computed(() => (editing.value ? "编辑用户组" : "新建用户组"));
const impact = computed(() => preview.value?.effectiveResult);
const snapshot = (): string =>
  JSON.stringify({
    name: draft.name.trim(),
    description: draft.description.trim(),
    members: draft.members.map((item) => item.id),
  });
const initial = ref(snapshot());
const dirty = computed(() => snapshot() !== initial.value);

const asDraft = (): GroupDraft => ({
  name: draft.name.trim(),
  description: draft.description.trim() || undefined,
  selection: {
    members: draft.members.map((item) => item.id),
    departments: emptySelectionDepartments(),
  },
});

const reset = (): void => {
  step.value = 0;
  editing.value = undefined;
  preview.value = null;
  draft.name = "";
  draft.description = "";
  draft.members = [];
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

const privateOpenPicker = (): void => {
  pickerRef.value?.show(draft.members);
};

const privateOnPicked = (members: IamSelectOption[]): void => {
  draft.members = members;
  preview.value = null;
};

const privateRemoveMember = (id: string): void => {
  draft.members = draft.members.filter((item) => item.id !== id);
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
        draft.members = await props.loadSelected(response.data.record.selection.members);
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

.iam-group-wizard__member-field {
  display: flex;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
  width: 100%;
  height: var(--in-control-height);
  padding: 0 11px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  background: var(--el-fill-color-blank);
  cursor: pointer;
}

.iam-group-wizard__member-field:hover,
.iam-group-wizard__member-field:focus-visible {
  border-color: var(--el-color-primary);
}

.iam-group-wizard__member-field:focus-visible {
  outline: none;
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}
</style>
