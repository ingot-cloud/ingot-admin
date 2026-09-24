<template>
  <in-drawer
    v-model="visible"
    title="创建套餐"
    size="100%"
    layout="pinned"
    padding="0"
    close-position="start"
    :loading="saving"
    :before-close="privateOnBeforeClose"
  >
    <div class="in-wizard-frame flex h-full min-h-0">
      <wizard-nav :steps="PLAN_WIZARD_STEPS" :current="step" />
      <section class="flex-1 min-w-0 min-h-0 flex flex-col px-48px py-24px">
        <div class="mb-24px text-18px shrink-0">{{ PLAN_WIZARD_STEPS[step].title }}</div>
        <div class="flex-1 min-h-0 overflow-auto">
          <in-form v-if="step === 0" class="max-w-560px" label-position="top">
            <el-form-item label="名称" required>
              <el-input v-model="draft.name" clearable placeholder="请输入套餐名称" />
            </el-form-item>
            <el-form-item label="说明">
              <el-input
                v-model="draft.description"
                type="textarea"
                :rows="3"
                placeholder="请输入说明"
              />
            </el-form-item>
          </in-form>
          <div v-else-if="step === 1" class="max-w-720px flex flex-col gap-12px">
            <div class="flex items-center justify-between gap-12px">
              <span>已选 {{ draft.applications.length }} 个应用</span>
              <in-button type="primary" link @in-click="privateOpenPicker">配置应用</in-button>
            </div>
            <div class="text-12px text-[var(--el-text-color-secondary)]">
              套餐变化不自动应用。开通不等于业务授权。
            </div>
            <application-list :items="draft.applications" />
          </div>
          <div v-else class="max-w-720px flex flex-col gap-16px">
            <div class="rounded-4px px-16px py-16px bg-[#f8f9fa] flex flex-col gap-12px">
              <div>名称：{{ draft.name.trim() }}</div>
              <div>说明：{{ draft.description.trim() || "-" }}</div>
            </div>
            <application-list :items="draft.applications" />
            <div class="text-12px text-[var(--el-text-color-secondary)]">
              创建后修改套餐不会自动改变既有租户开通。
            </div>
          </div>
        </div>
      </section>
    </div>
    <template #footer>
      <in-button v-if="step > 0" @in-click="privateBack">上一步</in-button>
      <in-button v-if="step < 2" type="primary" @in-click="privateNext">下一步</in-button>
      <in-button v-else type="primary" :loading="saving" @in-click="privateSubmit">创建</in-button>
    </template>
  </in-drawer>
  <application-picker-dialog
    ref="pickerRef"
    :load-applications="loadTenantApplications"
    @confirm="privateOnPicked"
  />
</template>

<script setup lang="ts">
import { confirmUnsavedChanges, Message } from "@ingot/admin-core";
import { PlatformPlanCreateAPI } from "@/api/iam/catalog";
import { platformPlanQueryKeys } from "@/api/iam/catalog.query";
import { useQueryClient } from "@tanstack/vue-query";
import WizardNav from "../../shared-roles/components/WizardNav.vue";
import { loadTenantApplications, PLAN_WIZARD_STEPS, type PlanAppOption } from "../wizard";
import ApplicationList from "./ApplicationList.vue";
import ApplicationPickerDialog from "./ApplicationPickerDialog.vue";

defineOptions({ name: "PlanCreateWizard" });

const emits = defineEmits<{ success: [] }>();
const queryClient = useQueryClient();
const visible = ref(false);
const saving = ref(false);
const step = ref(0);
const pickerRef = ref<{ show: (current: PlanAppOption[]) => void }>();
const draft = reactive({
  name: "",
  description: "",
  applications: [] as PlanAppOption[],
});
const dirty = computed(
  () => draft.name.trim().length > 0 || draft.description.trim().length > 0 || draft.applications.length > 0,
);

const reset = (): void => {
  step.value = 0;
  draft.name = "";
  draft.description = "";
  draft.applications = [];
  saving.value = false;
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

const privateBack = (): void => {
  step.value = Math.max(0, step.value - 1);
};

const privateNext = (): void => {
  if (step.value === 0 && !draft.name.trim()) {
    Message.warning("请输入套餐名称");
    return;
  }
  step.value += 1;
};

const privateOpenPicker = (): void => {
  pickerRef.value?.show(draft.applications);
};

const privateOnPicked = (applications: PlanAppOption[]): void => {
  draft.applications = applications;
};

const privateSubmit = (): void => {
  if (!draft.name.trim()) {
    Message.warning("请输入套餐名称");
    return;
  }
  saving.value = true;
  PlatformPlanCreateAPI({
    name: draft.name.trim(),
    description: draft.description.trim() || undefined,
    applicationIds: draft.applications.map((item) => item.id),
  })
    .then(() => {
      Message.success("创建成功，修改套餐不会自动改变既有租户开通");
      void queryClient.invalidateQueries({ queryKey: platformPlanQueryKeys.lists() });
      visible.value = false;
      emits("success");
    })
    .finally(() => {
      saving.value = false;
    });
};

defineExpose({
  show() {
    reset();
    visible.value = true;
  },
});
</script>
