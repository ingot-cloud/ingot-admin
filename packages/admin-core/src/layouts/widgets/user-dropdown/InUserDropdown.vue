<template>
  <div v-if="!hasMenu" class="in-user-dropdown is-static" :class="{ 'is-compact': compact }">
    <component :is="resolvedTrigger" v-if="resolvedTrigger" :user="userInfo" :compact="compact" />
    <in-avatar v-else :src="avatar" :name="username" :show-name="false" />
  </div>
  <el-dropdown v-else trigger="click" @command="privateOnCommand">
    <div class="in-user-dropdown" :class="{ 'is-compact': compact }" cursor-pointer>
      <component :is="resolvedTrigger" v-if="resolvedTrigger" :user="userInfo" :compact="compact" />
      <template v-else>
        <in-avatar :src="avatar" :name="username" :show-name="false" />
        <in-icon class="avatar-arrow" name="bxs:down-arrow" />
      </template>
    </div>
    <template #dropdown>
      <el-dropdown-menu class="user-dropdown">
        <li class="in-user-dropdown__profile">
          <div class="username-dropdown">
            <in-avatar :src="avatar" :name="username" :size="36" :show-name="false" />
            <div class="username">
              {{ username }}
            </div>
          </div>
        </li>
        <li
          class="in-user-dropdown__divider"
          role="separator"
          data-testid="user-dropdown-header-divider"
        ></li>
        <template v-for="item in displayMenuItems" :key="item.key">
          <li
            v-if="item.type === InAdminHeaderUserMenuItemType.Divider"
            class="in-user-dropdown__divider"
            role="separator"
            :data-testid="`user-dropdown-divider-${item.key}`"
          ></li>
          <el-dropdown-item
            v-else
            :command="item.key"
            :disabled="item.disabled || pendingKey === item.key"
          >
            <div
              class="user-dropdown-item"
              :class="{ 'is-danger': item.name === InAdminHeaderBuiltinUserMenuName.Logout }"
            >
              <in-icon v-if="item.icon" class="icon" :name="item.icon" />
              {{ item.label }}
            </div>
          </el-dropdown-item>
        </template>
      </el-dropdown-menu>
    </template>
  </el-dropdown>

  <FixPwdDialog v-if="!restricted" ref="PwdDialogRef" />
  <ProfileDialog v-if="!restricted" ref="ProfileDialogRef" />
</template>
<script lang="ts" setup>
import type { Component } from "vue";
import InAvatar from "@/components/avatar/InAvatar.vue";
import { useUserInfoStore } from "@/stores/modules/auth";
import { logoutAndReload } from "@/utils/security";
import { useLogin } from "@/hooks/biz/useLogin";
import { useMessage, useMessageConfirm } from "@/hooks/web/useMessage";
import FixPwdDialog from "./FixPwdDialog.vue";
import ProfileDialog from "./ProfileDialog.vue";
import { InAdminHeaderBuiltinUserMenuName, InAdminHeaderUserMenuItemType } from "@/plugin/header";
import {
  resolveHeaderConfig,
  type ResolvedHeaderUserMenuItem,
} from "../header/resolveHeaderConfig";
import { normalizeUserMenuItems } from "./normalizeUserMenuItems";
import { resolvePasswordChangeHeader } from "../header/passwordChangeHeader";

defineOptions({
  name: "InUserDropdown",
});

const props = defineProps<{
  menu?: ResolvedHeaderUserMenuItem[];
  compact?: boolean;
  trigger?: Component;
  /** 强制改密页面在清理会话并跳转前仍只允许退出登录。 */
  passwordChangeRequired?: boolean;
}>();

const PwdDialogRef = ref<{ show: () => void }>();
const ProfileDialogRef = ref<{ show: () => void }>();
const pendingKey = ref<string>();
const { getUsername, getAvatar, getIsInitPwd } = storeToRefs(useUserInfoStore());
const restricted = computed(() => Boolean(props.passwordChangeRequired) || getIsInitPwd.value);
const username = computed(() => (restricted.value ? "当前账号" : getUsername.value));
const avatar = computed(() => (restricted.value ? "" : getAvatar.value));
const resolvedTrigger = computed(() => (restricted.value ? undefined : props.trigger));
const message = useMessage();
const confirm = useMessageConfirm();

const menuItems = computed(() =>
  restricted.value
    ? resolvePasswordChangeHeader().user.menu
    : (props.menu ?? resolveHeaderConfig().user.menu),
);
const displayMenuItems = computed(() => normalizeUserMenuItems(menuItems.value));
const hasMenu = computed(() =>
  displayMenuItems.value.some((item) => item.type !== InAdminHeaderUserMenuItemType.Divider),
);
const userInfo = computed(() => ({
  username: username.value ?? "",
  avatar: avatar.value,
}));

const privateRunBuiltin = async (name: ResolvedHeaderUserMenuItem["name"]) => {
  if (name === InAdminHeaderBuiltinUserMenuName.SwitchOrg) {
    try {
      await confirm.warning("是否切换组织");
      useLogin().go();
    } catch {
      return;
    }
    return;
  }
  if (name === InAdminHeaderBuiltinUserMenuName.Profile) {
    ProfileDialogRef.value?.show();
    return;
  }
  if (name === InAdminHeaderBuiltinUserMenuName.FixPwd) {
    PwdDialogRef.value?.show();
    return;
  }
  if (name === InAdminHeaderBuiltinUserMenuName.Logout) {
    logoutAndReload();
  }
};

const privateOnCommand = async (key: string) => {
  const item = menuItems.value.find((entry) => entry.key === key);
  if (
    !item ||
    item.disabled ||
    item.type === InAdminHeaderUserMenuItemType.Divider ||
    pendingKey.value
  ) {
    return;
  }
  pendingKey.value = key;
  try {
    if (item.type === InAdminHeaderUserMenuItemType.Builtin) {
      await privateRunBuiltin(item.name);
      return;
    }
    await item.onClick?.();
  } catch (error) {
    const text = error instanceof Error ? error.message : "操作失败";
    message.error(text);
  } finally {
    pendingKey.value = undefined;
  }
};
</script>
<style scoped lang="postcss">
.in-user-dropdown {
  @apply flex flex-row items-center;
}

.avatar-arrow {
  color: var(--in-text-color-secondary);
  margin-left: 8px;
}
.user-dropdown {
  padding: 8px;

  & .in-user-dropdown__profile {
    list-style: none;
    margin: 0;
    padding: 0 var(--in-space-3);
  }

  & .in-user-dropdown__divider {
    display: block;
    height: 1px;
    min-height: 0;
    margin: var(--in-space-1) 0;
    padding: 0;
    border: 0;
    list-style: none;
    line-height: 0;
    background: var(--in-border-color);
    pointer-events: none;
  }

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

    &.is-danger {
      color: var(--in-color-danger);
    }

    & .icon {
      margin-right: 5px;
      font-size: 16px;
    }
  }
}
</style>
