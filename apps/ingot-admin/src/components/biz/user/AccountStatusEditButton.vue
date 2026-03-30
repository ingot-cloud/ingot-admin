<template>
  <in-button
    :text="text"
    :link="link"
    :type="enabled ? 'danger' : 'success'"
    @click="handleEnableClick"
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
    @click="handleLockClick"
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
          style="width: 100%"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
      </el-form-item>
    </in-form>
    <template #footer>
      <in-button type="primary" @click="handleLockConfirmClick" :loading="lockLoading">
        确定
      </in-button>
    </template>
  </in-dialog>
</template>
<script lang="ts" setup>
import {
  EnableAccountAPI,
  DisableAccountAPI,
  LockAccountAPI,
  UnlockAccountAPI,
} from "@/api/platform/system/user";
import { Icon } from "@iconify/vue";

const props = defineProps({
  userId: {
    type: String,
    required: true,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  locked: {
    type: Boolean,
    default: false,
  },
  text: {
    type: Boolean,
    default: true,
  },
  link: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["success"]);

const message = useMessage();
const confirm = useMessageConfirm();

const lockLoading = ref(false);
const lockTitle = ref("");
const lockVisible = ref(false);
const lockFormRef = ref();
const lockForm = ref({
  reasonDetail: "",
  lockedUntil: "",
});
const rules = {
  reasonDetail: [{ required: true, message: "原因不能为空", trigger: "blur" }],
  lockedUntil: [{ required: true, message: "锁定时间不能为空", trigger: "blur" }],
};

const handleEnableClick = () => {
  const action = props.enabled ? "禁用" : "启用";
  confirm.warning(`是否${action}该用户`).then(() => {
    if (props.enabled) {
      DisableAccountAPI(props.userId).then(() => {
        message.success("操作成功");
        emit("success");
      });
    } else {
      EnableAccountAPI(props.userId).then(() => {
        message.success("操作成功");
        emit("success");
      });
    }
  });
};

const handleLockClick = () => {
  lockVisible.value = true;
  lockTitle.value = props.locked ? "解锁用户" : "锁定用户";
  lockForm.value.reasonDetail = "";
  lockForm.value.lockedUntil = "";
  nextTick(() => {
    lockFormRef.value.clearValidate();
  });
};

const handleLockConfirmClick = () => {
  lockFormRef.value.validate((valid: boolean) => {
    if (!valid) {
      return;
    }

    const request = props.locked ? UnlockAccountAPI : LockAccountAPI;
    request(props.userId, lockForm.value)
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
