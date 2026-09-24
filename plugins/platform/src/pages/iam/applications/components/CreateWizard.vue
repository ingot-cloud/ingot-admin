<template>
  <in-drawer
    v-model="visible"
    title="创建应用"
    size="100%"
    layout="pinned"
    padding="0"
    close-position="start"
    :loading="saving"
    :before-close="privateOnBeforeClose"
  >
    <div class="flex h-full min-h-0">
      <wizard-nav :steps="APP_WIZARD_STEPS" :current="step" />
      <section class="flex-1 min-w-0 min-h-0 flex flex-col px-48px py-24px">
        <div class="mb-24px text-18px shrink-0">{{ APP_WIZARD_STEPS[step].title }}</div>
        <div class="flex-1 min-h-0" :class="step === 1 || step === 2 ? 'overflow-hidden' : 'overflow-auto'">
          <in-form v-if="step === 0" class="max-w-560px" label-position="top">
            <el-form-item label="编码" required>
              <el-input v-model="profile.code" clearable placeholder="如 contacts，创建后不可改" />
            </el-form-item>
            <el-form-item label="名称" required>
              <el-input v-model="profile.name" clearable placeholder="请输入应用名称" />
            </el-form-item>
            <el-form-item label="图标">
              <application-icon-field v-model="profile.icon" />
            </el-form-item>
            <el-form-item label="说明">
              <el-input v-model="profile.description" type="textarea" :rows="3" placeholder="请输入说明" />
            </el-form-item>
            <el-form-item label="排序">
              <el-input-number v-model="profile.sortOrder" :min="0" placeholder="请输入排序" />
            </el-form-item>
            <el-form-item v-if="canBaseline" label="组织默认">
              <el-switch v-model="profile.baseline" />
            </el-form-item>
          </in-form>
          <catalog-draft-panel
            v-else-if="step === 1"
            v-model="resources"
            :profile="profile"
          />
          <menu-draft-panel
            v-else-if="step === 2"
            v-model:resources="resources"
            v-model:menus="menus"
            :profile="profile"
          />
          <app-preview-panel
            v-else
            :profile="profile"
            :resources="resources"
            :menus="menus"
            :show-baseline="canBaseline"
          />
        </div>
      </section>
    </div>
    <template #footer>
      <in-button v-if="step > 0" @in-click="privateBack">上一步</in-button>
      <in-button v-if="step < 3" type="primary" @in-click="privateNext">下一步</in-button>
      <in-button v-else type="primary" :loading="saving" @in-click="privateSubmit">创建</in-button>
    </template>
  </in-drawer>
</template>

<script setup lang="ts">
import { confirmUnsavedChanges, Message } from "@ingot/admin-core";
import { AuthorizationDomain } from "@ingot/admin-common";
import { PlatformApplicationBundleCreateAPI } from "@/api/iam/catalog";
import { platformApplicationQueryKeys } from "@/api/iam/catalog.query";
import { useQueryClient } from "@tanstack/vue-query";
import WizardNav from "../../shared-roles/components/WizardNav.vue";
import {
  APP_WIZARD_STEPS,
  catalogDirty,
  catalogError,
  emptyAppProfile,
  menuError,
  profileDirty,
  profileError,
  resetDraftIds,
  toApplicationBundle,
  type DraftMenu,
  type DraftResource,
} from "../createWizard";
import ApplicationIconField from "./ApplicationIconField.vue";
import AppPreviewPanel from "./AppPreviewPanel.vue";
import CatalogDraftPanel from "./CatalogDraftPanel.vue";
import MenuDraftPanel from "./MenuDraftPanel.vue";

defineOptions({ name: "ApplicationCreateWizard" });

const emits = defineEmits<{ success: [] }>();
const queryClient = useQueryClient();
const visible = ref(false);
const saving = ref(false);
const step = ref(0);
const domain = ref(AuthorizationDomain.PLATFORM);
const profile = reactive(emptyAppProfile());
const resources = ref<DraftResource[]>([]);
const menus = ref<DraftMenu[]>([]);
const canBaseline = computed(() => domain.value === AuthorizationDomain.TENANT);
const dirty = computed(() => profileDirty(profile) || catalogDirty(resources.value, menus.value));

const reset = (): void => {
  resetDraftIds();
  step.value = 0;
  Object.assign(profile, emptyAppProfile());
  resources.value = [];
  menus.value = [];
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
  if (step.value === 0) {
    const error = profileError(profile);
    if (error) {
      Message.warning(error);
      return;
    }
  }
  if (step.value === 1) {
    const error = catalogError(resources.value);
    if (error) {
      Message.warning(error);
      return;
    }
  }
  if (step.value === 2) {
    const error = menuError(menus.value);
    if (error) {
      Message.warning(error);
      return;
    }
  }
  step.value = Math.min(3, step.value + 1);
};

const privateSubmit = async (): Promise<void> => {
  const firstError = profileError(profile) ?? catalogError(resources.value) ?? menuError(menus.value);
  if (firstError) {
    Message.warning(firstError);
    return;
  }
  saving.value = true;
  try {
    await PlatformApplicationBundleCreateAPI(
      toApplicationBundle(profile, domain.value, resources.value, menus.value),
    );
    Message.success("创建成功");
    visible.value = false;
    void queryClient.invalidateQueries({ queryKey: platformApplicationQueryKeys.lists() });
    emits("success");
  } finally {
    saving.value = false;
  }
};

defineExpose({
  show(next: AuthorizationDomain) {
    reset();
    domain.value = next;
    visible.value = true;
  },
});
</script>
