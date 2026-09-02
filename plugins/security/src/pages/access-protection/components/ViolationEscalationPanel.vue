<template>
  <div class="violation-escalation-panel" v-loading="loading || saving">
    <div class="panel-header">
      <div class="panel-header__info">
        <div class="panel-header__title">违规升级</div>
        <div class="panel-header__desc">
          在计数窗口内，同一维度触发限流拒绝达到阈值后，将自动写入临时封禁名单。
        </div>
      </div>
      <div class="panel-header__actions">
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
          <el-form-item label="计数窗口(秒)" prop="windowSec">
            <el-input-number v-model="form.windowSec" :min="1" class="w-full" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="拒绝次数阈值" prop="blockThreshold">
            <el-input-number v-model="form.blockThreshold" :min="1" class="w-full" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="临时封禁 TTL(秒)" prop="tempBlockTtlSec">
            <el-input-number v-model="form.tempBlockTtlSec" :min="1" class="w-full" />
          </el-form-item>
        </el-col>
      </el-row>
    </in-form>
  </div>
</template>

<script setup lang="ts">
import type { ViolationEscalationConfig } from "@/models";
import { copyParams } from "@ingot/admin-core";
import { useViolationEscalation } from "../use/useViolationEscalation";

const { loading, saving, config, load, save } = useViolationEscalation();

const editing = ref(false);
const formRef = ref();
const form = reactive<ViolationEscalationConfig>({
  id: undefined,
  windowSec: 60,
  blockThreshold: 30,
  tempBlockTtlSec: 900,
  enabled: true,
});
const rawForm = reactive<ViolationEscalationConfig>({});

const confirm = useMessageConfirm();

const rules = {
  windowSec: [{ required: true, type: "number", min: 1, message: "窗口秒数至少为 1", trigger: "change" }],
  blockThreshold: [
    { required: true, type: "number", min: 1, message: "阈值至少为 1", trigger: "change" },
  ],
  tempBlockTtlSec: [
    { required: true, type: "number", min: 1, message: "封禁 TTL 至少为 1", trigger: "change" },
  ],
};

const syncForm = (value?: ViolationEscalationConfig): void => {
  copyParams(form, {
    windowSec: 60,
    blockThreshold: 30,
    tempBlockTtlSec: 900,
    enabled: true,
  });
  if (value) {
    copyParams(form, value);
    copyParams(rawForm, value);
  }
};

const privateOnEditClick = (): void => {
  editing.value = true;
};

const privateOnCancelClick = (): void => {
  editing.value = false;
  syncForm(config.value);
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

    await confirm.warning("确认保存违规升级配置？");
    await save(Object.assign({}, toRaw(form)));
    editing.value = false;
  });
};

watch(
  () => config.value,
  (value) => {
    if (editing.value) {
      return;
    }
    syncForm(value);
  },
  { immediate: true },
);

onMounted(() => {
  load();
});

defineExpose({
  refresh: load,
});
</script>

<style lang="postcss" scoped>
.violation-escalation-panel {
  @apply px-12px py-16px;

  & .panel-header {
    @apply flex flex-row items-start justify-between gap-4 mb-20px pb-16px border-b border-[var(--in-border-color)] border-b-solid;
  }

  & .panel-header__info {
    @apply flex-1 min-w-0;
  }

  & .panel-header__title {
    @apply text-15px font-500 text-[var(--in-text-color-primary)] mb-6px;
  }

  & .panel-header__desc {
    @apply text-13px text-[var(--in-text-color-secondary)] leading-relaxed;
  }

  & .panel-header__actions {
    @apply flex flex-none flex-row items-center gap-2;
  }
}
</style>
