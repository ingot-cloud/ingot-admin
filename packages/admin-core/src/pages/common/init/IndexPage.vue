<template>
  <el-container w-full h-full>
    <el-header class="in-shell-header">
      <in-app-bar />
    </el-header>

    <el-container direction="vertical">
      <el-main>
        <div class="content-box">
          <div class="header">
            <div class="title">初始化密码</div>
          </div>

          <div class="tips">请设置您的登录密码</div>

          <el-form
            ref="editFormRef"
            class="form-box"
            label-width="80px"
            label-position="top"
            :model="editForm"
            :rules="rules"
          >
            <el-form-item prop="newPassword" label="新密码">
              <el-input
                v-model="editForm.newPassword"
                placeholder="请输入新密码"
                type="password"
                clearable
                show-password
              ></el-input>
            </el-form-item>
            <el-form-item prop="confirmPassword" label="确认密码">
              <el-input
                v-model="editForm.confirmPassword"
                placeholder="请确认新密码"
                type="password"
                clearable
                show-password
              ></el-input>
            </el-form-item>
          </el-form>
          <el-form-item>
            <div w-full flex flex-row justify-center>
              <in-button type="primary" @click="handleConfirmClick"> 确定 </in-button>
            </div>
          </el-form-item>
        </div>
      </el-main>

      <in-copyright v-if="appStateStore.getShowCopyright" />
    </el-container>
  </el-container>
</template>
<script lang="ts" setup>
import { useAppStateStore } from "@/stores/modules/app";
import { InitPwdAPI } from "@/api/common/password";
import { useUserInfoStore } from "@/stores/modules/auth";

const rules = {
  newPassword: [{ required: true, message: "请输入新密码", trigger: "blur" }],
  confirmPassword: [{ required: true, message: "请确认新密码", trigger: "blur" }],
};

interface EditForm {
  newPassword?: string;
  confirmPassword?: string;
}

const appStateStore = useAppStateStore();
const userInfoStore = useUserInfoStore();
const { getIsInitPwd } = storeToRefs(userInfoStore);
const loading = ref(false);
const editFormRef = ref();
const editForm = reactive<EditForm>({});
const message = useMessage();
const go = useGo();

const handleConfirmClick = () => {
  editFormRef.value.validate((valid: boolean) => {
    if (valid) {
      if (editForm.newPassword !== editForm.confirmPassword) {
        message.warning("新密码不一致");
        return;
      }

      loading.value = true;
      InitPwdAPI({
        newPassword: editForm.newPassword,
      })
        .then(() => {
          loading.value = false;
          message.success("设置成功");
          userInfoStore.clear();
          useLogin().go();
        })
        .catch(() => {
          loading.value = false;
        });
    }
  });
};

onMounted(() => {
  useGlobalLoading().stop();
  if (!getIsInitPwd.value) {
    go(
      {
        path: "/",
      },
      true,
    );
  }
});
</script>
<style lang="postcss" scoped>
.el-container {
  @apply bg-[var(--in-bg-color-page)];
}

.el-main {
  @apply flex items-center justify-center bg-[var(--in-bg-color-page)] box-border p-[var(--in-page-gutter)] overflow-auto;
  &::-webkit-scrollbar {
    @apply bg-[var(--in-bg-color-page)];
  }
}

.content-box {
  @apply box-border bg-[var(--in-bg-color)];
  border: 1px solid var(--in-border-color);
  border-radius: var(--in-radius-card);
  width: 40%;
  padding: var(--in-section-padding-relaxed);
  & .header {
    display: flex;
    flex-direction: row;
    align-items: center;
    & .title {
      font-weight: 600;
      color: var(--in-text-color);
      font-size: var(--in-font-size-page-title);
      line-height: var(--in-line-height-page-title);
    }
  }
  & .tips {
    font-size: var(--in-font-size-body);
    line-height: var(--in-line-height-body);
    font-weight: 400;
    color: var(--in-text-color-secondary);
    margin-top: var(--in-space-2);
  }

  & .form-box {
    margin-top: var(--in-space-5);
  }
}
</style>
