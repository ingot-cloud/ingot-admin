<template>
  <in-loading :loading="saving" class="login-failure-dimension-panel">
    <div class="panel-toolbar">
      <div>
        <h3 class="panel-toolbar__title">{{ policyTitle }}</h3>
        <div class="panel-toolbar__hint">{{ hint }}</div>
      </div>
      <div class="panel-toolbar__actions">
        <template v-if="editing">
          <in-button :disabled="saving || confirming" @click="privateOnCancelClick">取消</in-button>
          <in-button
            v-auth="SecurityAction.LOGIN_UPDATE"
            type="primary"
            :loading="saving"
            :disabled="confirming"
            @click="privateOnSaveClick"
            >保存</in-button
          >
        </template>
        <in-button
          v-else
          v-auth="SecurityAction.LOGIN_UPDATE"
          type="primary"
          @click="privateOnEditClick"
          >编辑</in-button
        >
      </div>
    </div>

    <in-form ref="formRef" class="policy-form" :model="form" :rules="rules" :editing="editing">
      <el-row :gutter="24">
        <el-col :xs="24" :sm="12" :lg="12">
          <in-detail-field label="是否启用" :value="form.enabled ? '启用' : '停用'">
            <el-switch
              v-if="editing"
              v-model="form.enabled"
              inline-prompt
              active-text="是"
              inactive-text="否"
            />
          </in-detail-field>
        </el-col>
      </el-row>
      <el-row :gutter="24">
        <el-col :xs="24" :sm="12" :lg="12">
          <in-detail-field label="最大失败次数" prop="maxAttempts" :value="form.maxAttempts">
            <el-input-number
              v-if="editing"
              v-model="form.maxAttempts"
              :min="1"
              class="w-full"
              placeholder="请输入最大失败次数"
            />
          </in-detail-field>
        </el-col>
        <el-col :xs="24" :sm="12" :lg="12">
          <in-detail-field label="统计窗口(分钟)" prop="windowMinutes" :value="form.windowMinutes">
            <el-input-number
              v-if="editing"
              v-model="form.windowMinutes"
              :min="1"
              class="w-full"
              placeholder="请输入统计窗口分钟数"
            />
          </in-detail-field>
        </el-col>
        <el-col :xs="24" :sm="12" :lg="12">
          <in-detail-field label="封禁时长(秒)" prop="blockTtlSec" :value="form.blockTtlSec">
            <el-input-number
              v-if="editing"
              v-model="form.blockTtlSec"
              :min="60"
              class="w-full"
              placeholder="请输入封禁秒数"
            />
          </in-detail-field>
        </el-col>
      </el-row>
      <el-row :gutter="24">
        <el-col :span="24">
          <in-detail-field label="备注" :value="form.remark">
            <el-input
              v-if="editing"
              v-model="form.remark"
              type="textarea"
              :rows="3"
              clearable
              placeholder="请输入展示说明"
            />
          </in-detail-field>
        </el-col>
        <el-col :xs="24" :sm="12" :lg="12">
          <in-detail-field label="封禁 Key 类型" :value="form.blockKeyType">
            <el-input
              v-if="editing"
              :model-value="form.blockKeyType"
              disabled
              placeholder="由策略决定，不可改"
            />
          </in-detail-field>
        </el-col>
      </el-row>
      <div v-if="form.updatedAt" class="panel-meta">
        最近更新：{{ formatDateTime(form.updatedAt) }}
      </div>
    </in-form>
  </in-loading>
</template>

<script setup lang="ts">
import type { FormInstance } from "element-plus";
import { confirmUnsavedChanges, useCapabilities } from "@ingot/admin-core";
const { hasAction } = useCapabilities();
import { SecurityAction } from "@/hooks/useSecurityTabs";
import { formatDateTime } from "@ingot/shared";
import type { LoginFailureProtectionPolicyVO } from "@/models";
import { getLoginFailureDimensionHint, LoginFailureDimensionMetaList } from "@/models/enums";
import { copyParams } from "@ingot/admin-core";
import type { SavePolicyFn } from "../use/useLoginFailurePolicy";

const props = defineProps<{
  dimension: string;
  config?: LoginFailureProtectionPolicyVO;
  saving: boolean;
  savePolicy: SavePolicyFn;
}>();

const emits = defineEmits<{ saved: [] }>();

const editing = ref(false);
const confirming = ref(false);
let editSnapshot: LoginFailureProtectionPolicyVO | undefined;
const EDITABLE_POLICY_FIELDS = [
  "enabled",
  "maxAttempts",
  "windowMinutes",
  "blockTtlSec",
  "remark",
] as const;
watch(
  () => hasAction(SecurityAction.LOGIN_UPDATE),
  (allowed) => {
    if (!allowed) privateOnCancelClick();
  },
);
const formRef = ref<FormInstance>();
const form = reactive<LoginFailureProtectionPolicyVO>({
  dimension: props.dimension,
  enabled: true,
  maxAttempts: 1,
  windowMinutes: 1,
  blockTtlSec: 60,
  blockKeyType: undefined,
  remark: undefined,
});

const confirm = useMessageConfirm();

const hint = computed(() => getLoginFailureDimensionHint(props.dimension));
const policyTitle = computed(
  () =>
    `${LoginFailureDimensionMetaList.find((item) => item.value === props.dimension)?.label ?? props.dimension} 防护策略`,
);

const rules = {
  maxAttempts: [{ required: true, type: "number", min: 1, message: "至少为 1", trigger: "change" }],
  windowMinutes: [
    { required: true, type: "number", min: 1, message: "至少为 1", trigger: "change" },
  ],
  blockTtlSec: [
    { required: true, type: "number", min: 60, message: "至少为 60 秒", trigger: "change" },
  ],
};

const syncForm = (config?: LoginFailureProtectionPolicyVO): void => {
  copyParams(form, {
    dimension: props.dimension,
    enabled: true,
    maxAttempts: 1,
    windowMinutes: 1,
    blockTtlSec: 60,
    blockKeyType: undefined,
    remark: undefined,
    updatedAt: undefined,
  });
  if (config) {
    copyParams(form, config);
  }
};

const privateOnEditClick = (): void => {
  if (!hasAction(SecurityAction.LOGIN_UPDATE)) return;
  editSnapshot = { ...toRaw(form) };
  editing.value = true;
};

const privateOnCancelClick = (): void => {
  editing.value = false;
  editSnapshot = undefined;
  syncForm(props.config);
  nextTick(() => {
    unref(formRef)?.clearValidate();
  });
};

const privateOnSaveClick = async (): Promise<void> => {
  if (!editing.value || props.saving || confirming.value || !hasAction(SecurityAction.LOGIN_UPDATE))
    return;
  const formInstance = unref(formRef);
  if (!formInstance) return;
  confirming.value = true;
  try {
    const valid = await new Promise<boolean>((resolve) => formInstance.validate(resolve));
    if (!valid || !editing.value || !hasAction(SecurityAction.LOGIN_UPDATE)) return;
    await confirm.warning(`确认保存「${policyTitle.value}」？`);
    if (!editing.value || !hasAction(SecurityAction.LOGIN_UPDATE)) return;
    await props.savePolicy(Object.assign({}, toRaw(form)));
    editing.value = false;
    editSnapshot = undefined;
    syncForm(props.config);
    emits("saved");
  } catch {
    // 校验不通过、取消确认或请求失败时保留草稿。
  } finally {
    confirming.value = false;
  }
};

watch(
  () => props.config,
  (config) => {
    if (editing.value) {
      return;
    }
    syncForm(config);
  },
  { immediate: true },
);

watch(
  () => props.dimension,
  (dimension) => {
    form.dimension = dimension;
  },
);

const prepareDimensionChange = async (): Promise<boolean> => {
  if (props.saving || confirming.value) return false;
  const changed =
    editing.value && EDITABLE_POLICY_FIELDS.some((field) => form[field] !== editSnapshot?.[field]);
  if (changed && !(await confirmUnsavedChanges())) return false;
  privateOnCancelClick();
  return true;
};

defineExpose({ dimension: computed(() => props.dimension), confirming, prepareDimensionChange });
</script>

<style lang="postcss" scoped>
.login-failure-dimension-panel {
  & .panel-toolbar {
    @apply flex flex-row items-center justify-between mb-16px gap-3;
  }

  & .panel-toolbar__hint {
    @apply text-13px text-[var(--in-text-color-secondary)];
  }

  & .panel-toolbar__title {
    @apply m-0 font-medium text-[var(--in-text-color)];
    font-size: var(--in-font-size-body);
    margin-bottom: var(--in-space-2);
  }

  & .panel-toolbar__actions {
    @apply flex flex-row items-center gap-2;
  }

  & .panel-meta {
    @apply text-12px text-[var(--in-text-color-secondary)] mt-8px;
  }
}
</style>
