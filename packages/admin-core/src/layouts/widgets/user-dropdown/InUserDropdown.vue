<template>
  <div cursor-pointer>
    <el-dropdown trigger="click" @command="handleMenuCommand">
      <div flex flex-row items-center>
        <img v-if="getAvatar" :src="getAvatar" class="user-avatar" />
        <div v-else class="username-avatar">
          {{ getUsername }}
        </div>
        <in-icon class="avatar-arrow" name="bxs:down-arrow"></in-icon>
      </div>
      <template #dropdown>
        <el-dropdown-menu class="user-dropdown">
          <el-dropdown-item>
            <div class="username-dropdown">
              <img v-if="getAvatar" :src="getAvatar" class="avatar" />
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
import type { UserDropdownCommand } from "./types";
import { menuList } from "./types";
import { useUserInfoStore } from "@/stores/modules/auth";
import { logoutAndReload } from "@/utils/security";
import FixPwdDrawer from "./FixPwdDrawer.vue";

const PwdDialogRef = ref();
const { getUsername, getAvatar } = storeToRefs(useUserInfoStore());
const handleMenuCommand = (command: UserDropdownCommand): void => {
  switch (command.action) {
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
.user-avatar {
  @apply h-24px w-24px rd-4px;
}
.username-avatar {
  height: 24px;
  line-height: 24px;
  font-size: 12px;
  border-radius: 4px;
  background: var(--in-color-primary);
  color: white;
  padding-left: 5px;
  padding-right: 5px;
}
.avatar-arrow {
  color: var(--in-color-primary);
  margin-left: 12px;
}
.user-dropdown {
  padding: 8px;

  & .username-dropdown {
    @apply flex flex-row;
    height: 70px;
    & .avatar {
      width: 36px;
      height: 36px;
      margin-right: 12px;
    }

    & .username {
      width: 124px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 16px;
      font-weight: 700;
      line-height: 1.5;
      color: #171a1d;
    }
  }

  & .user-dropdown-item {
    @apply flex flex-row items-center;
    height: 30px;
    font-size: 14px;
    font-weight: 400;
    color: rgba(0, 0, 0, 0.85);

    & .icon {
      margin-right: 5px;
      font-size: 16px;
    }
  }
}
</style>
