<template>
  <div class="basic-info-panel" v-loading="loading">
    <div class="info-section">
      <div class="info-section__title">概览</div>
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="info-item">
            <span class="info-item__label">应用编码</span>
            <in-copy-tag :text="form.code || '-'" />
          </div>
        </el-col>
        <el-col :span="6">
          <div class="info-item">
            <span class="info-item__label">根权限</span>
            <in-copy-tag :text="form.rootPermissionCode || '-'" />
          </div>
        </el-col>
        <el-col :span="6">
          <div class="info-item">
            <span class="info-item__label">菜单数量</span>
            <span class="info-item__value">{{ form.menuCount ?? 0 }}</span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="info-item">
            <span class="info-item__label">权限数量</span>
            <span class="info-item__value">{{ form.permissionCount ?? 0 }}</span>
          </div>
        </el-col>
      </el-row>
    </div>

    <div class="info-section">
      <div class="info-section__title">基本信息</div>
      <in-form ref="formRef" :model="form" :rules="rules" :disabled="!editing" label-width="90px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="应用名称" prop="name">
              <el-input v-model="form.name" clearable placeholder="请输入应用名称" maxlength="64" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序" prop="sort">
              <el-input-number v-model="form.sort" :min="0" :max="9999" w-full />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="应用图标" prop="icon">
              <el-input v-model="form.icon" clearable placeholder="请输入 icon 名称">
                <template #append>
                  <div
                    ref="iconButtonRef"
                    v-click-outside="privateOnIconPopoverClose"
                    w-full
                    h-full
                    flex
                    items-center
                    justify-center
                    cursor-pointer
                  >
                    <in-icon
                      v-if="form.icon"
                      :name="form.icon"
                      class="w-[var(--in-menu-icon-size)] h-[var(--in-menu-icon-size)]"
                    />
                  </div>
                </template>
              </el-input>
              <el-popover
                ref="iconPopoverRef"
                trigger="click"
                placement="bottom"
                :width="300"
                :virtual-ref="iconButtonRef"
                virtual-triggering
              >
                <in-icon-collection @onItemClick="privateOnIconSelect" />
              </el-popover>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="应用描述" prop="intro">
              <el-input
                v-model="form.intro"
                clearable
                show-word-limit
                maxlength="200"
                placeholder="请输入描述"
                type="textarea"
                :rows="4"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </in-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ClickOutside as vClickOutside } from "element-plus";
import type { PlatformAppDetailVO, PlatformAppUpdateDTO } from "@/models";
import { AppDetailAPI, UpdateAppAPI } from "@/api/platform/config/app";
import { getDiff } from "@/utils/object";

const props = defineProps<{
  appId: string;
}>();

const emit = defineEmits<{
  loaded: [detail: PlatformAppDetailVO];
}>();

const editing = defineModel<boolean>("editing", { default: false });

const rules = {
  name: [{ required: true, message: "请输入应用名称", trigger: "blur" }],
  intro: [{ required: true, message: "请输入应用描述", trigger: "blur" }],
};

const loading = ref(false);
const formRef = ref();
const iconButtonRef = ref();
const iconPopoverRef = ref();
const form = reactive<PlatformAppDetailVO>({});
const rawForm = reactive<PlatformAppDetailVO>({});

const privateOnIconSelect = (name: string): void => {
  form.icon = name;
  privateOnIconPopoverClose();
};

const privateOnIconPopoverClose = (): void => {
  unref(iconPopoverRef)?.popperRef?.delayHide?.();
};

const loadData = (appId: string): Promise<void> => {
  loading.value = true;
  return AppDetailAPI(appId)
    .then((response) => {
      Object.assign(form, response.data);
      Object.assign(rawForm, response.data);
      emit("loaded", { ...response.data });
    })
    .finally(() => {
      loading.value = false;
    });
};

const cancelEdit = (): void => {
  Object.assign(form, rawForm);
  editing.value = false;
  nextTick(() => {
    unref(formRef)?.clearValidate();
  });
};

const save = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    unref(formRef)?.validate((valid: boolean) => {
      if (!valid) {
        reject(new Error("validation failed"));
        return;
      }
      const diff = getDiff<PlatformAppUpdateDTO>(
        {
          name: rawForm.name,
          icon: rawForm.icon,
          intro: rawForm.intro,
          sort: rawForm.sort,
        },
        {
          name: form.name,
          icon: form.icon,
          intro: form.intro,
          sort: form.sort,
        },
      );
      if (Object.keys(diff).length === 0) {
        reject(new Error("no changes"));
        return;
      }
      loading.value = true;
      UpdateAppAPI(form.id!, diff)
        .then(() => {
          Object.assign(rawForm, form);
          editing.value = false;
          emit("loaded", { ...form });
          resolve();
        })
        .catch(reject)
        .finally(() => {
          loading.value = false;
        });
    });
  });
};

watch(
  () => props.appId,
  (id) => {
    if (id) {
      loadData(id);
    }
  },
  { immediate: true },
);

defineExpose({
  loadData,
  cancelEdit,
  save,
  getDetail: () => ({ ...form }),
});
</script>

<style lang="postcss" scoped>
.basic-info-panel {
  @apply p-20px flex flex-col gap-20px;
}

.info-section {
  @apply flex flex-col gap-16px;

  border: 1px solid var(--in-border-color);
  padding: 10px;
  border-radius: 10px;

  & .info-section__title {
    @apply text-14px font-500 text-[var(--in-text-color-primary)] pl-8px;
    border-left: 3px solid var(--in-color-primary);
  }
}

.info-item {
  @apply flex flex-col gap-6px pb-12px;

  &__label {
    @apply text-12px text-[var(--in-text-color-secondary)];
  }

  &__value {
    @apply text-14px text-[var(--in-text-color-primary)];
  }
}
</style>
