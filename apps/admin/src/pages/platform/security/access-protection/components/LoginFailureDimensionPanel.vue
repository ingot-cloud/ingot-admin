<template>
  <div class="login-failure-dimension-panel" v-loading="saving">
    <div class="panel-toolbar">
      <div class="panel-toolbar__hint">{{ hint }}</div>
      <div class="panel-toolbar__actions">
        <template v-if="editing">
          <in-button @click="privateOnCancelClick">取消</in-button>
          <in-button type="primary" :loading="saving" @click="privateOnSaveClick">保存</in-button>
        </template>
        <in-button v-else type="primary" @click="privateOnEditClick">编辑</in-button>
      </div>
    </div>

    <in-form ref="formRef" class="policy-form" :model="form" :rules="rules" :disabled="!editing">
      <el-row :gutter="24">
        <el-col :span="8">
          <el-form-item label="是否启用">
            <el-switch v-model="form.enabled" inline-prompt active-text="是" inactive-text="否" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="24">
        <el-col :span="8">
          <el-form-item label="最大失败次数" prop="maxAttempts">
            <el-input-number v-model="form.maxAttempts" :min="1" class="w-full" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="统计窗口(分钟)" prop="windowMinutes">
            <el-input-number v-model="form.windowMinutes" :min="1" class="w-full" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="封禁时长(秒)" prop="blockTtlSec">
            <el-input-number v-model="form.blockTtlSec" :min="60" class="w-full" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="24">
        <el-col :span="16">
          <el-form-item label="备注">
            <el-input
              v-model="form.remark"
              type="textarea"
              :rows="3"
              clearable
              placeholder="请输入展示说明"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="封禁 Key 类型">
            <el-input :model-value="form.blockKeyType" disabled />
          </el-form-item>
        </el-col>
      </el-row>
      <div v-if="form.updatedAt" class="panel-meta">最近更新：{{ form.updatedAt }}</div>
    </in-form>
  </div>
</template>

<script setup lang="ts">
import type { LoginFailureProtectionPolicyVO } from "@base/models";
import { getLoginFailureDimensionHint } from "@base/models/enums";
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
const formRef = ref();
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

const rules = {
  maxAttempts: [{ required: true, type: "number", min: 1, message: "至少为 1", trigger: "change" }],
  windowMinutes: [{ required: true, type: "number", min: 1, message: "至少为 1", trigger: "change" }],
  blockTtlSec: [{ required: true, type: "number", min: 60, message: "至少为 60 秒", trigger: "change" }],
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
  editing.value = true;
};

const privateOnCancelClick = (): void => {
  editing.value = false;
  syncForm(props.config);
  nextTick(() => {
    unref(formRef)?.clearValidate();
  });
};

const privateOnSaveClick = (): void => {
  const formInstance = unref(formRef);
  formInstance?.validate(async (valid: boolean) => {
    if (!valid) {
      return;
    }

    await confirm.warning(`确认保存「${props.dimension}」维度的登录失败保护策略？`);
    await props.savePolicy(Object.assign({}, toRaw(form)));
    editing.value = false;
    emits("saved");
  });
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
</script>

<style lang="postcss" scoped>
.login-failure-dimension-panel {
  & .panel-toolbar {
    @apply flex flex-row items-center justify-between mb-16px gap-3;
  }

  & .panel-toolbar__hint {
    @apply text-13px text-[var(--in-text-color-secondary)];
  }

  & .panel-toolbar__actions {
    @apply flex flex-row items-center gap-2;
  }

  & .panel-meta {
    @apply text-12px text-[var(--in-text-color-secondary)] mt-8px;
  }
}
</style>
