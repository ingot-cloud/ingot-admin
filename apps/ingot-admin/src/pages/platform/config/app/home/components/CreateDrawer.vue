<template>
  <in-drawer :title="title" v-model="visible" width="480px" @close="loading = false">
    <in-form ref="editFormRef" class="form" :model="editForm" :rules="rules">
      <el-form-item label="应用编码" prop="code">
        <el-input
          v-model="editForm.code"
          clearable
          placeholder="如 contacts，创建后不可修改"
          maxlength="64"
        />
      </el-form-item>
      <el-form-item label="应用名称" prop="name">
        <el-input v-model="editForm.name" clearable placeholder="请输入应用名称" maxlength="64" />
      </el-form-item>
      <el-form-item label="应用类型" prop="appType">
        <in-select
          w-full
          v-model="editForm.appType"
          placeholder="请选择应用类型"
          :options="appTypeEnum.getOptions()"
        />
      </el-form-item>
      <el-form-item label="应用图标" prop="icon">
        <el-input v-model="editForm.icon" clearable placeholder="请输入 icon 名称">
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
                v-if="editForm.icon"
                :name="editForm.icon"
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
      <el-form-item label="排序" prop="sort">
        <el-input-number v-model="editForm.sort" :min="0" :max="9999" w-full />
      </el-form-item>
      <el-form-item label="应用描述" prop="intro">
        <el-input
          v-model="editForm.intro"
          clearable
          show-word-limit
          maxlength="200"
          placeholder="请输入描述"
          type="textarea"
        />
      </el-form-item>
    </in-form>
    <template #footer>
      <in-button @click="visible = false">取消</in-button>
      <in-button :loading="loading" type="primary" @click="privateOnConfirm">确定</in-button>
    </template>
  </in-drawer>
</template>

<script setup lang="ts">
import { ClickOutside as vClickOutside } from "element-plus";
import type { PlatformAppCreateDTO } from "@/models";
import { AppTypeEnum, useAppTypeEnum } from "@/models/enums";
import { CreateAppAPI } from "@/api/platform/config/app";

const emit = defineEmits<{
  success: [appId?: string];
}>();

const rules = {
  code: [
    { required: true, message: "请输入应用编码", trigger: "blur" },
    { pattern: /^[a-z][a-z0-9:.-_]*$/, message: "编码需以小写字母开头", trigger: "blur" },
  ],
  name: [{ required: true, message: "请输入应用名称", trigger: "blur" }],
  appType: [{ required: true, message: "请选择应用类型", trigger: "change" }],
  intro: [{ required: true, message: "请输入应用描述", trigger: "blur" }],
};

const defaultEditForm: PlatformAppCreateDTO = {
  code: undefined,
  name: undefined,
  appType: AppTypeEnum.Tenant,
  icon: undefined,
  intro: undefined,
  sort: 100,
};

const appTypeEnum = useAppTypeEnum();
const message = useMessage();

const editFormRef = ref();
const iconButtonRef = ref();
const iconPopoverRef = ref();
const editForm = reactive<PlatformAppCreateDTO>({ ...defaultEditForm });
const loading = ref(false);
const title = ref("添加应用");
const visible = ref(false);

const privateOnIconSelect = (name: string): void => {
  editForm.icon = name;
  privateOnIconPopoverClose();
};

const privateOnIconPopoverClose = (): void => {
  unref(iconPopoverRef)?.popperRef?.delayHide?.();
};

const privateOnConfirm = (): void => {
  unref(editFormRef)?.validate((valid: boolean) => {
    if (!valid) {
      return;
    }
    loading.value = true;
    CreateAppAPI({ ...toRaw(editForm) })
      .then((response) => {
        loading.value = false;
        message.success("操作成功");
        visible.value = false;
        emit("success", response.data);
      })
      .catch(() => {
        loading.value = false;
      });
  });
};

defineExpose({
  show(): void {
    visible.value = true;
    Object.assign(editForm, defaultEditForm);
    nextTick(() => {
      unref(editFormRef)?.clearValidate();
    });
  },
});
</script>
