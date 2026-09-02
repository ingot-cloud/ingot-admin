<template>
  <in-button
    :text="text"
    :link="link"
    :type="enabled ? 'danger' : 'success'"
    @click="privateOnEnableClick"
  >
    <template #icon>
      <Icon :icon="enabled ? 'ep:circle-close' : 'ep:circle-check'" />
    </template>
    {{ enabled ? "禁用" : "启用" }}
  </in-button>
  <in-button
    :text="text"
    :link="link"
    :disabled="!enabled"
    :type="locked ? 'success' : 'danger'"
    @click="privateOnLockClick"
  >
    <template #icon>
      <Icon :icon="locked ? 'ep:unlock' : 'ep:lock'" />
    </template>
    {{ locked ? "解锁" : "锁定" }}
  </in-button>
  <in-dialog :title="lockTitle" v-model="lockVisible" append-to-body>
    <in-form ref="lockFormRef" :model="lockForm" :rules="rules" m-t-20px>
      <el-form-item :label="locked ? '解锁原因' : '锁定原因'" prop="reasonDetail">
        <el-input
          v-model="lockForm.reasonDetail"
          clearable
          :placeholder="locked ? '请输入解锁原因' : '请输入锁定原因'"
          maxlength="200"
          show-word-limit
          type="textarea"
        ></el-input>
      </el-form-item>
      <el-form-item v-if="!locked" label="锁定时间" prop="lockedUntil">
        <el-date-picker
          v-model="lockForm.lockedUntil"
          type="datetime"
          placeholder="请选择锁定时间"
          class="w-full"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
      </el-form-item>
    </in-form>
    <template #footer>
      <in-button type="primary" @click="privateOnLockConfirmClick" :loading="lockLoading">
        确定
      </in-button>
    </template>
  </in-dialog>
</template>
<script lang="ts" setup>
import type { FormInstance } from "element-plus";
import { Icon } from "@iconify/vue";
import type {
  DisableAccountAPI,
  EnableAccountAPI,
  LockAccountAPI,
  UnlockAccountAPI,
} from "./types";

const props = withDefaults(
  defineProps<{
    userId: string;
    enabled?: boolean;
    locked?: boolean;
    text?: boolean;
    link?: boolean;
    enableAccountAPI?: EnableAccountAPI;
    disableAccountAPI?: DisableAccountAPI;
    lockAccountAPI?: LockAccountAPI;
    unlockAccountAPI?: UnlockAccountAPI;
  }>(),
  {
    enabled: true,
    locked: false,
    text: true,
    link: true,
  },
);

const emit = defineEmits<{
  success: [];
}>();

const message = useMessage();
const confirm = useMessageConfirm();

const lockLoading = ref(false);
const lockTitle = ref("");
const lockVisible = ref(false);
const lockFormRef = ref<FormInstance>();
const lockForm = ref({
  reasonDetail: "",
  lockedUntil: "",
});
const rules = {
  reasonDetail: [{ required: true, message: "原因不能为空", trigger: "blur" }],
  lockedUntil: [{ required: true, message: "锁定时间不能为空", trigger: "blur" }],
};

const privateOnEnableClick = () => {
  const action = props.enabled ? "禁用" : "启用";
  confirm.warning(`是否${action}该用户`).then(() => {
    if (props.enabled) {
      props.disableAccountAPI?.(props.userId).then(() => {
        message.success("操作成功");
        emit("success");
      });
      return;
    }
    props.enableAccountAPI?.(props.userId).then(() => {
      message.success("操作成功");
      emit("success");
    });
  });
};

const privateOnLockClick = () => {
  lockVisible.value = true;
  lockTitle.value = props.locked ? "解锁用户" : "锁定用户";
  lockForm.value.reasonDetail = "";
  lockForm.value.lockedUntil = "";
  nextTick(() => {
    lockFormRef.value?.clearValidate();
  });
};

const privateOnLockConfirmClick = () => {
  lockFormRef.value?.validate((valid: boolean) => {
    if (!valid) {
      return;
    }

    const request = props.locked ? props.unlockAccountAPI : props.lockAccountAPI;
    request?.(props.userId, lockForm.value)
      .then(() => {
        lockLoading.value = false;
        message.success("操作成功");
        lockVisible.value = false;
        emit("success");
      })
      .catch(() => {
        lockLoading.value = false;
      });
  });
};
</script>
