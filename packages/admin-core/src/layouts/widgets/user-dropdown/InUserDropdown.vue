<template>
  <div cursor-pointer>
    <el-dropdown trigger="click" @command="handleMenuCommand">
      <div flex flex-row items-center>
        <in-avatar :src="getAvatar" :name="getUsername" :show-name="false" />
        <in-icon class="avatar-arrow" name="bxs:down-arrow"></in-icon>
      </div>
      <template #dropdown>
        <el-dropdown-menu class="user-dropdown">
          <el-dropdown-item>
            <div class="username-dropdown">
              <in-avatar :src="getAvatar" :name="getUsername" :size="36" :show-name="false" />
              <div class="username">
                {{ getUsername }}
              </div>
            </div>
          </el-dropdown-item>
          <el-dropdown-item
            v-for="item in menuList"
            :key="item.title"
            :command="item.command"
            :divided="item.divided"
          >
            <div class="user-dropdown-item" :style="item.style">
              <Icon class="icon" :icon="item.icon" />
              {{ item.title }}
            </div>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>

  <FixPwdDrawer ref="PwdDialogRef" />
</template>
<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import InAvatar from "@/components/avatar/InAvatar.vue";
import type { UserDropdownCommand } from "./types";
import { menuList } from "./types";
import { useUserInfoStore } from "@/stores/modules/auth";
import { logoutAndReload } from "@/utils/security";
import { useLogin } from "@/hooks/biz/useLogin";
import { useMessageConfirm } from "@/hooks/web/useMessage";
import FixPwdDrawer from "./FixPwdDrawer.vue";

const PwdDialogRef = ref();
const { getUsername, getAvatar } = storeToRefs(useUserInfoStore());
const handleMenuCommand = (command: UserDropdownCommand): void => {
  switch (command.action) {
    case "switchOrg":
      useMessageConfirm()
        .warning("是否切换组织")
        .then(() => {
          useLogin().go();
        });
      break;
    case "fixPwd":
      PwdDialogRef.value.show();
      break;
    case "logout":
      logoutAndReload();
      break;
  }
};
</script>
<style scoped lang="postcss">
.avatar-arrow {
  color: var(--in-text-color-secondary);
  margin-left: 8px;
}
.user-dropdown {
  padding: 8px;

  & .username-dropdown {
    @apply flex flex-row items-center;
    height: 70px;
    gap: 12px;

    & .username {
      width: 124px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 16px;
      font-weight: 700;
      line-height: 1.5;
      color: var(--in-text-color);
    }
  }

  & .user-dropdown-item {
    @apply flex flex-row items-center;
    height: 30px;
    font-size: 14px;
    font-weight: 400;
    color: var(--in-text-color-secondary);

    & .icon {
      margin-right: 5px;
      font-size: 16px;
    }
  }
}
</style>
