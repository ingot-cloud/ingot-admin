<template>
  <el-container w-full h-full>
    <el-header>
      <in-app-bar />
    </el-header>

    <el-container direction="vertical">
      <el-main>
        <div class="content-box">
          <div class="header">
            <div class="rect" />
            <div class="title">初始化密码</div>
          </div>

          <div class="tips">第一次登录请设置您的登录密码</div>

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
import { InitPwdAPI } from "@/api/org/user";
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
          go(
            {
              path: "/",
            },
            true,
          );
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
.el-header {
  --el-header-padding: var(--in-app-bar-padding);
  --el-header-height: var(--in-app-bar-height);
  @apply flex items-center justify-between box-border dark:bg-[var(--in-bg-color)];
  @apply b-b b-b-[var(--in-app-bar-bg)] dark:b-b-[var(--in-border-color)];
  background: var(--in-app-bar-bg);
  box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.16);
  color: white;
}

.el-container {
  @apply bg-[var(--in-bg-color-page)];
}

.el-main {
  @apply flex items-center justify-center bg-[var(--in-bg-color-page)] box-border p-[var(--in-common-padding)] overflow-x-hidden;
  &::-webkit-scrollbar {
    @apply bg-[var(--in-bg-color-page)];
  }
}

.content-box {
  @apply box-border overflow-x-hidden shadow-sm bg-[var(--in-bg-color)];
  border-radius: var(--in-common-border-radius);
  width: 40%;
  padding: 20px;
  & .header {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
    grid-gap: 10px;
    & .rect {
      width: 4px;
      height: 14px;
      background: var(--in-color-primary);
      border-radius: 2px;
    }
    & .title {
      font-weight: bold;
      color: #192f48;
      font-size: 18px;
    }
  }
  & .tips {
    font-size: 14px;
    line-height: 34px;
    font-weight: 400;
    color: rgba(23, 26, 29, 0.6);
  }

  & .form-box {
    margin-top: 20px;
  }
}
</style>
