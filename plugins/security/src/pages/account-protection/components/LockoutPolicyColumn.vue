<template>
  <div class="lockout-column">
    <div class="lockout-column__header">
      <div class="lockout-column__title-wrap">
        <div class="lockout-column__title">{{ title }}</div>
        <div class="lockout-column__hint">{{ hint }}</div>
      </div>
      <div v-if="config" class="lockout-column__actions">
        <template v-if="editing">
          <in-button @click="privateOnCancelClick">取消</in-button>
          <in-button type="primary" :loading="saving" @click="privateOnSaveClick">保存</in-button>
        </template>
        <in-button v-else v-auth-any="updateAuths" type="primary" @click="privateOnEditClick">
          编辑
        </in-button>
      </div>
    </div>

    <el-empty v-if="!config" description="暂无该端账号锁定策略" />

    <in-form
      v-else
      ref="formRef"
      class="lockout-column__form"
      :model="form"
      :rules="rules"
      :disabled="!editing"
    >
      <el-row :gutter="16">
        <el-col :span="allowPermanent ? 12 : 24">
          <el-form-item label="是否启用">
            <el-switch v-model="form.enabled" inline-prompt active-text="是" inactive-text="否" />
          </el-form-item>
        </el-col>
        <el-col v-if="allowPermanent" :span="12">
          <el-form-item label="永久锁定">
            <el-switch v-model="permanent" inline-prompt active-text="是" inactive-text="否" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="失败次数阈值" prop="maxAttempts">
            <el-input-number v-model="form.maxAttempts" :min="1" class="w-full" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="锁定时长(分钟)" prop="lockDurationMinutes">
            <el-input-number
              v-model="form.lockDurationMinutes"
              :min="durationMin"
              :disabled="!editing || permanent"
              class="w-full"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="失败计数窗口(分钟)" prop="attemptWindowMinutes">
            <el-input-number v-model="form.attemptWindowMinutes" :min="1" class="w-full" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="提示起始次数" prop="hintAfterAttempts">
            <el-input-number v-model="form.hintAfterAttempts" :min="1" class="w-full" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="备注">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="3"
          maxlength="255"
          show-word-limit
          clearable
          placeholder="请输入备注"
        />
      </el-form-item>
      <div v-if="form.updatedAt" class="lockout-column__meta">最近更新：{{ form.updatedAt }}</div>
    </in-form>
  </div>
</template>

<script setup lang="ts">
import type { AccountLockoutPolicy } from "@/models";
import { SessionUserTypeEnum } from "@/models/enums";
import { ROLE_SYSTEM_ADMIN_CODE } from "@ingot/admin-core";
import { copyParams } from "@ingot/admin-core";
import type { SaveLockoutPolicyFn } from "../use/useLockoutPolicy";
import { LOCKOUT_UPDATE_PERMISSION } from "../constants";

defineOptions({
  name: "LockoutPolicyColumn",
});

const props = defineProps<{
  title: string;
  userType: string;
  config?: AccountLockoutPolicy;
  saving: boolean;
  savePolicy: SaveLockoutPolicyFn;
}>();

const emits = defineEmits<{ saved: [] }>();

const DEFAULT_ADMIN_DURATION = 30;
const DEFAULT_APP_DURATION = 15;

const editing = ref(false);
const formRef = ref();
const lastNonZeroDuration = ref(
  props.userType === SessionUserTypeEnum.ADMIN ? DEFAULT_ADMIN_DURATION : DEFAULT_APP_DURATION,
);
const form = reactive<AccountLockoutPolicy>({
  userType: props.userType,
  enabled: true,
  maxAttempts: 5,
  lockDurationMinutes:
    props.userType === SessionUserTypeEnum.ADMIN ? DEFAULT_ADMIN_DURATION : DEFAULT_APP_DURATION,
  attemptWindowMinutes: 15,
  hintAfterAttempts: 3,
  remark: undefined,
});

const confirm = useMessageConfirm();
const updateAuths = [LOCKOUT_UPDATE_PERMISSION, ROLE_SYSTEM_ADMIN_CODE];

const allowPermanent = computed(() => props.userType === SessionUserTypeEnum.ADMIN);
const durationMin = computed(() => (allowPermanent.value ? 0 : 1));

const hint = computed(() =>
  allowPermanent.value
    ? "失败达到阈值后自动锁定管理员账号，可将锁定时长设为永久。"
    : "失败达到阈值后自动锁定会员账号，不允许永久锁定。",
);

const permanent = computed({
  get: () => allowPermanent.value && form.lockDurationMinutes === 0,
  set: (value: boolean) => {
    if (!allowPermanent.value) {
      return;
    }
    if (value) {
      if (form.lockDurationMinutes > 0) {
        lastNonZeroDuration.value = form.lockDurationMinutes;
      }
      form.lockDurationMinutes = 0;
      return;
    }
    form.lockDurationMinutes =
      lastNonZeroDuration.value > 0 ? lastNonZeroDuration.value : DEFAULT_ADMIN_DURATION;
  },
});

const rules = computed(() => ({
  maxAttempts: [
    {
      required: true,
      type: "number",
      min: 1,
      message: "最大失败次数不能小于 1",
      trigger: "change",
    },
  ],
  lockDurationMinutes: [
    {
      required: true,
      type: "number",
      trigger: "change",
      validator: (
        _rule: unknown,
        value: number | null | undefined,
        callback: (error?: Error) => void,
      ) => {
        if (allowPermanent.value && value === 0) {
          callback();
          return;
        }
        if (value === undefined || value === null || value < 1) {
          callback(
            new Error(allowPermanent.value ? "锁定时长至少为 1 分钟" : "C端账号禁止永久自动锁定"),
          );
          return;
        }
        callback();
      },
    },
  ],
  attemptWindowMinutes: [
    {
      required: true,
      type: "number",
      min: 1,
      message: "失败计数窗口不能小于 1 分钟",
      trigger: "change",
    },
  ],
  hintAfterAttempts: [
    {
      required: true,
      type: "number",
      trigger: "change",
      validator: (
        _rule: unknown,
        value: number | null | undefined,
        callback: (error?: Error) => void,
      ) => {
        if (value === undefined || value === null || value < 1 || value > form.maxAttempts) {
          callback(new Error("提示起始次数必须在 1 与失败阈值之间"));
          return;
        }
        callback();
      },
    },
  ],
}));

const syncForm = (config?: AccountLockoutPolicy): void => {
  copyParams(form, {
    userType: props.userType,
    enabled: true,
    maxAttempts: 5,
    lockDurationMinutes:
      props.userType === SessionUserTypeEnum.ADMIN ? DEFAULT_ADMIN_DURATION : DEFAULT_APP_DURATION,
    attemptWindowMinutes: 15,
    hintAfterAttempts: 3,
    remark: undefined,
    createdAt: undefined,
    updatedAt: undefined,
    id: undefined,
  });
  if (config) {
    copyParams(form, config);
    if (config.lockDurationMinutes && config.lockDurationMinutes > 0) {
      lastNonZeroDuration.value = config.lockDurationMinutes;
    }
    if (form.remark === null) {
      form.remark = undefined;
    }
  }
  form.userType = props.userType;
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

    try {
      await confirm.warning(`确认保存「${props.title}」账号锁定策略？`);
      await props.savePolicy({
        userType: form.userType,
        enabled: form.enabled,
        maxAttempts: form.maxAttempts,
        lockDurationMinutes: form.lockDurationMinutes,
        attemptWindowMinutes: form.attemptWindowMinutes,
        hintAfterAttempts: form.hintAfterAttempts,
        remark: form.remark ?? null,
      });
      editing.value = false;
      emits("saved");
    } catch {
      // 用户取消或保存失败时保持编辑态
    }
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
  () => props.userType,
  (userType) => {
    form.userType = userType;
  },
);
</script>

<style lang="postcss" scoped>
.lockout-column {
  @apply h-full flex flex-col border border-solid border-[var(--in-border-color)] p-16px;
  border-radius: var(--in-common-border-radius);

  & .lockout-column__header {
    @apply flex flex-row items-start justify-between gap-3 mb-16px;
  }

  & .lockout-column__title-wrap {
    @apply min-w-0 flex-1;
  }

  & .lockout-column__title {
    @apply text-16px font-medium;
  }

  & .lockout-column__hint {
    @apply mt-4px text-13px text-[var(--in-text-color-secondary)];
  }

  & .lockout-column__actions {
    @apply flex flex-none flex-row items-center gap-2;
  }

  & .lockout-column__meta {
    @apply text-12px text-[var(--in-text-color-secondary)] mt-8px;
  }
}
</style>
