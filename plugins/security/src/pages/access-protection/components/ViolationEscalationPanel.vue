<template>
  <in-loading :loading="loading || saving" class="violation-escalation-panel">
    <in-form-content>
      <div class="panel-header">
        <div class="panel-header__info">
          <div class="panel-header__title">违规升级</div>
          <div class="panel-header__desc">
            在计数窗口内，同一维度触发限流拒绝达到阈值后，将自动写入临时封禁名单。
          </div>
        </div>
        <div class="panel-header__actions">
          <template v-if="editing">
            <in-button :disabled="saving" @click="privateOnCancelClick">取消</in-button>
            <in-button
              v-auth="SecurityAction.POLICY_UPDATE"
              type="primary"
              :loading="saving"
              @click="privateOnSaveClick"
              >保存</in-button
            >
          </template>
          <in-button
            v-else
            v-auth="SecurityAction.POLICY_UPDATE"
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
            <in-detail-field label="计数窗口(秒)" prop="windowSec" :value="form.windowSec">
              <el-input-number
                v-if="editing"
                v-model="form.windowSec"
                :min="1"
                class="w-full"
                placeholder="请输入计数窗口秒数"
              />
            </in-detail-field>
          </el-col>
          <el-col :xs="24" :sm="12" :lg="12">
            <in-detail-field
              label="拒绝次数阈值"
              prop="blockThreshold"
              :value="form.blockThreshold"
            >
              <el-input-number
                v-if="editing"
                v-model="form.blockThreshold"
                :min="1"
                class="w-full"
                placeholder="请输入拒绝次数阈值"
              />
            </in-detail-field>
          </el-col>
          <el-col :xs="24" :sm="12" :lg="12">
            <in-detail-field
              label="临时封禁 TTL(秒)"
              prop="tempBlockTtlSec"
              :value="form.tempBlockTtlSec"
            >
              <el-input-number
                v-if="editing"
                v-model="form.tempBlockTtlSec"
                :min="1"
                class="w-full"
                placeholder="请输入临时封禁秒数"
              />
            </in-detail-field>
          </el-col>
        </el-row>
      </in-form>
    </in-form-content>
  </in-loading>
</template>

<script setup lang="ts">
import type { FormInstance } from "element-plus";
import { useCapabilities } from "@ingot/admin-core";
const { hasAction } = useCapabilities();
import { SecurityAction } from "@/hooks/useSecurityTabs";
import type { ViolationEscalationConfig } from "@/models";
import { copyParams } from "@ingot/admin-core";
import { useViolationEscalation } from "../use/useViolationEscalation";

const { loading, saving, config, load, save } = useViolationEscalation();

const editing = ref(false);
watch(
  () => hasAction(SecurityAction.POLICY_UPDATE),
  (allowed) => {
    if (!allowed) privateOnCancelClick();
  },
);
const formRef = ref<FormInstance>();
const form = reactive<ViolationEscalationConfig>({
  id: undefined,
  windowSec: 60,
  blockThreshold: 30,
  tempBlockTtlSec: 900,
  enabled: true,
});

const confirm = useMessageConfirm();

const rules = {
  windowSec: [
    { required: true, type: "number", min: 1, message: "窗口秒数至少为 1", trigger: "change" },
  ],
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
  }
};

const privateOnEditClick = (): void => {
  if (!hasAction(SecurityAction.POLICY_UPDATE)) return;
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
  if (!editing.value || saving.value || !hasAction(SecurityAction.POLICY_UPDATE)) return;
  const formInstance = unref(formRef);
  formInstance?.validate(async (valid: boolean) => {
    if (!valid) {
      return;
    }

    try {
      await confirm.warning("确认保存违规升级配置？");
      if (!hasAction(SecurityAction.POLICY_UPDATE)) return;
      await save(Object.assign({}, toRaw(form)));
      editing.value = false;
      syncForm(config.value);
    } catch {
      /* Cancel or request failure keeps the draft. */
    }
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

defineExpose({
  refresh: load,
});
</script>

<style lang="postcss" scoped>
.violation-escalation-panel {
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
