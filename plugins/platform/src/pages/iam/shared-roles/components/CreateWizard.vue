<template>
  <in-drawer
    v-model="visible"
    title="创建共享角色"
    size="100%"
    layout="pinned"
    padding="0"
    :loading="saving"
    :before-close="privateOnBeforeClose"
  >
    <div class="flex h-full min-h-0">
      <aside class="w-240px shrink-0 px-24px py-24px b-r b-r-solid b-[var(--in-border-color)]">
        <div v-for="(item, index) in WIZARD_STEPS" :key="item.title" class="flex gap-12px mb-24px last:mb-0">
          <div
            class="w-24px h-24px rounded-full flex items-center justify-center text-12px shrink-0"
            :class="stepTone(index)"
          >
            <el-icon v-if="index < step"><Check /></el-icon>
            <span v-else>{{ index + 1 }}</span>
          </div>
          <div>
            <div :class="index === step ? 'text-[var(--el-color-primary)]' : 'text-[var(--in-text-color)]'">
              {{ item.title }}
            </div>
            <div class="text-12px text-[var(--el-text-color-secondary)] mt-4px">{{ item.description }}</div>
          </div>
        </div>
      </aside>
      <section class="flex-1 min-w-0 min-h-0 flex flex-col px-48px py-24px">
        <div class="mb-24px text-18px shrink-0">{{ WIZARD_STEPS[step].title }}</div>
        <div class="flex-1 min-h-0" :class="step === 1 ? 'overflow-hidden' : 'overflow-auto'">
          <in-form v-if="step === 0" class="max-w-560px">
            <el-form-item label="编码" required>
              <el-input v-model="profile.code" placeholder="发布后不可改" />
            </el-form-item>
            <el-form-item label="名称" required>
              <el-input v-model="profile.name" placeholder="请输入角色名称" />
            </el-form-item>
            <el-form-item label="说明">
              <el-input v-model="profile.description" type="textarea" :rows="3" placeholder="请输入说明" />
            </el-form-item>
            <el-form-item label="分组">
              <el-input v-model="profile.groupName" placeholder="请输入分组，可空" />
            </el-form-item>
          </in-form>
          <grant-picker v-else-if="step === 1" v-model="grants" />
          <scope-step v-else-if="step === 2" v-model="grants" />
          <preview-panel v-else :profile="profile" :grants="grants" />
        </div>
      </section>
    </div>
    <template #footer>
      <in-button v-if="step > 0" @in-click="privateBack">上一步</in-button>
      <in-button v-if="step < 3" type="primary" @in-click="privateNext">下一步</in-button>
      <in-button v-else type="primary" :loading="saving" @in-click="privateSubmit">
        创建并发布首个版本
      </in-button>
    </template>
  </in-drawer>
</template>

<script setup lang="ts">
import { Check } from "@element-plus/icons-vue";
import { confirmUnsavedChanges, Message } from "@ingot/admin-core";
import { PlatformSharedRoleCreateAPI } from "@/api/iam/authorization";
import GrantPicker from "./GrantPicker.vue";
import PreviewPanel from "./PreviewPanel.vue";
import ScopeStep from "./ScopeStep.vue";
import {
  emptyWizardProfile,
  missingParameterKeys,
  profileDirty,
  toCreateInput,
  WIZARD_STEPS,
  type SelectedGrant,
} from "../wizard";

defineOptions({ name: "CreateWizard" });

const emits = defineEmits<{ success: [] }>();
const visible = ref(false);
const saving = ref(false);
const step = ref(0);
const profile = reactive(emptyWizardProfile());
const grants = ref<SelectedGrant[]>([]);

const dirty = computed(() => profileDirty(profile) || grants.value.length > 0);

const stepTone = (index: number): string => {
  if (index < step.value) {
    return "bg-[var(--el-color-primary)] text-white";
  }
  if (index === step.value) {
    return "bg-[var(--el-color-primary)] text-white";
  }
  return "bg-[var(--el-fill-color)] text-[var(--el-text-color-secondary)]";
};

const reset = (): void => {
  step.value = 0;
  Object.assign(profile, emptyWizardProfile());
  grants.value = [];
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
  if (step.value === 0 && (!profile.code.trim() || !profile.name.trim())) {
    Message.warning("请填写编码和名称");
    return;
  }
  if (step.value === 1 && !grants.value.length) {
    Message.warning("请至少选择一条操作");
    return;
  }
  if (step.value === 2) {
    const missing = missingParameterKeys(grants.value);
    if (missing.length) {
      Message.warning(`请为 ${missing[0]} 填写参数键`);
      return;
    }
  }
  step.value = Math.min(3, step.value + 1);
};

const privateSubmit = (): void => {
  saving.value = true;
  PlatformSharedRoleCreateAPI(toCreateInput(profile, grants.value))
    .then(() => {
      Message.success("已创建并发布首个版本，既有授权不会自动升级");
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
