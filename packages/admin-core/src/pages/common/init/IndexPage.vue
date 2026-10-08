<template>
  <el-container w-full h-full>
    <el-header class="in-shell-header">
      <in-app-bar password-change-required />
    </el-header>

    <el-container direction="vertical">
      <el-main>
        <div class="content-box">
          <div class="header">
            <div class="title">修改密码</div>
          </div>

          <div class="tips">为保障账号安全，请先修改登录密码，完成后使用新密码重新登录</div>

          <el-form
            ref="editFormRef"
            class="form-box"
            label-width="80px"
            label-position="top"
            :model="editForm"
            :rules="rules"
            @submit.prevent="privateOnConfirm"
          >
            <el-form-item prop="newPassword" label="新密码">
              <el-input
                v-model="editForm.newPassword"
                placeholder="请输入新密码"
                type="password"
                clearable
                show-password
                autocomplete="new-password"
                :disabled="loading"
              ></el-input>
            </el-form-item>
            <el-form-item prop="confirmPassword" label="确认密码">
              <el-input
                v-model="editForm.confirmPassword"
                placeholder="请再次输入新密码"
                type="password"
                clearable
                show-password
                autocomplete="new-password"
                :disabled="loading"
              ></el-input>
            </el-form-item>
            <in-button w-full type="primary" native-type="submit" :loading="loading">
              修改密码并重新登录
            </in-button>
          </el-form>
        </div>
      </el-main>

      <in-copyright v-if="appStateStore.getShowCopyright" />
    </el-container>
  </el-container>
</template>
<script lang="ts" setup>
import type { FormInstance } from "element-plus";
import { useAppStateStore } from "@/stores/modules/app";
import { InitPwdAPI } from "@/api/common/password";
import { useAuthStore, useUserInfoStore } from "@/stores/modules/auth";
import { useGlobalLoading } from "@/hooks/biz/useGlobalLoading";
import { useLogin } from "@/hooks/biz/useLogin";
import { useMessage } from "@/hooks/web/useMessage";
import { useGo } from "@/hooks/web/useRouter";

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
const editFormRef = ref<FormInstance>();
const editForm = reactive<EditForm>({});
const message = useMessage();
const go = useGo();

const privateOnConfirm = async () => {
  if (loading.value) return;
  const form = editFormRef.value;
  if (!form) return;
  loading.value = true;
  try {
    await form.validate();
    if (editForm.newPassword !== editForm.confirmPassword) {
      message.warning("新密码不一致");
      return;
    }
    await InitPwdAPI({
      newPassword: editForm.newPassword ?? "",
      confirmPassword: editForm.confirmPassword ?? "",
    });
    message.success("密码设置成功，请使用新密码重新登录");
    await useAuthStore().logout();
    await useLogin().go({ rememberReturnTo: false });
  } catch {
    // 表单展示字段错误，API 错误由统一请求层反馈；失败仍留在受限页面。
  } finally {
    loading.value = false;
  }
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
  width: 100%;
  max-width: 480px;
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
