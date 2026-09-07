<template>
  <in-dialog :title="title" v-model="visible" append-to-body>
    <in-form ref="formRef" :model="form" :rules="rules" class="m-t-20px">
      <el-form-item :label="locked ? '解锁原因' : '锁定原因'" prop="reasonDetail">
        <el-input
          v-model="form.reasonDetail"
          clearable
          :placeholder="locked ? '请输入解锁原因' : '请输入锁定原因'"
          maxlength="200"
          show-word-limit
          type="textarea"
        />
      </el-form-item>
      <el-form-item v-if="!locked" label="锁定时间" prop="lockedUntil">
        <el-date-picker
          v-model="form.lockedUntil"
          type="datetime"
          placeholder="请选择锁定时间"
          class="w-full"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
      </el-form-item>
    </in-form>
    <template #footer>
      <in-button type="primary" :loading="loading" @click="privateOnConfirm">确定</in-button>
    </template>
  </in-dialog>
</template>

<script lang="ts" setup>
import type { FormInstance } from "element-plus";
import type { AccountLockDTO, LockAccountAPI, UnlockAccountAPI } from "@ingot/admin-core";

const props = defineProps<{
  lockApi?: LockAccountAPI;
  unlockApi?: UnlockAccountAPI;
}>();

const emit = defineEmits<{
  success: [];
}>();

const message = useMessage();
const visible = ref(false);
const loading = ref(false);
const userId = ref("");
const locked = ref(false);
const title = computed(() => (locked.value ? "解锁用户" : "锁定用户"));
const formRef = ref<FormInstance>();
const form = ref<AccountLockDTO>({
  reasonDetail: "",
  lockedUntil: "",
});
const rules = {
  reasonDetail: [{ required: true, message: "原因不能为空", trigger: "blur" }],
  lockedUntil: [{ required: true, message: "锁定时间不能为空", trigger: "blur" }],
};

const show = (params: { userId: string; locked?: boolean }): void => {
  userId.value = params.userId;
  locked.value = Boolean(params.locked);
  form.value = { reasonDetail: "", lockedUntil: "" };
  visible.value = true;
  nextTick(() => {
    formRef.value?.clearValidate();
  });
};

const privateOnConfirm = (): void => {
  formRef.value?.validate((valid: boolean) => {
    if (!valid) {
      return;
    }
    loading.value = true;
    const request = locked.value ? props.unlockApi : props.lockApi;
    request?.(userId.value, form.value)
      .then(() => {
        message.success("操作成功");
        visible.value = false;
        emit("success");
      })
      .finally(() => {
        loading.value = false;
      });
  });
};

defineExpose({ show });
</script>
