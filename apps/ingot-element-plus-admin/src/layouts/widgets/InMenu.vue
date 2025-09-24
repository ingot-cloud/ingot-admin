<template>
  <div
    class="in-menu"
    :class="[getMenuOpened ? 'w-[var(--in-menu-show)]' : 'w-[var(--in-menu-hide)]']"
  >
    <div class="menu-header" @click="switchOrg">
      <img class="logo-image" :src="userInforStore.getCurrentOrg?.avatar" />
      <div class="right-box" v-if="getMenuOpened">
        <div class="title">{{ userInforStore.getCurrentOrg?.name }}</div>
        <div class="auth-box" :class="{ authenticated: isAuth }">
          <in-icon v-if="!isAuth" name="ph:seal-question-duotone" class="icon"></in-icon>
          <in-icon v-else name="bx:shield" class="icon"></in-icon>
          <div class="auth">{{ isAuth ? "已认证" : "未认证" }}</div>
        </div>
      </div>
      <in-icon v-if="getMenuOpened" name="icon-park:switch" />
    </div>
    <el-scrollbar>
      <el-menu
        class="overflow-x-hidden b-r-none!"
        :collapse="!getMenuOpened"
        :default-active="activePath"
        :collapse-transition="false"
        :unique-opened="true"
        router
      >
        <in-submenu v-for="route in getMenus" :key="route.path" :route="route" />
      </el-menu>
    </el-scrollbar>
    <div
      class="menu-control"
      :class="[getMenuOpened ? 'w-[var(--in-menu-show)]' : 'w-[var(--in-menu-hide)]']"
      @click="toggle"
    >
      <div class="content">
        <in-icon v-if="getMenuOpened" name="line-md:arrow-left" class="icon" />
        <in-icon v-else name="line-md:arrow-right" class="icon" />
        <div v-if="getMenuOpened" class="title">收起菜单</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useAppStateStore } from "@/stores/modules/app";
import { useUserInfoStore } from "@/stores/modules/auth";
import { useRouterStore } from "@/stores/modules/router";

// 现在只显示已认证状态
const isAuth = ref(true);
const router = useRouter();
const appStateStore = useAppStateStore();
const userInforStore = useUserInfoStore();
const { getMenuOpened } = storeToRefs(appStateStore);
let lastActivePath = "/";
const activePath = computed(() => {
  const route = router.currentRoute.value;

  // 如果当前路由需要隐藏菜单
  // 1.展示其父path
  // 2.如果不存在父path，那么展示上一个激活的路由
  if (route.meta.hideMenu) {
    const matched = route.matched;
    if (matched.length > 1) {
      const parent = matched[matched.length - 2];
      return parent.children.find((item) => item.path === parent.redirect)?.path;
    }
    return lastActivePath;
  }
  lastActivePath = route.path;
  return route.path;
});

const { getMenus } = storeToRefs(useRouterStore());
const toggle = () => {
  appStateStore.toggleMenu();
};

const switchOrg = () => {
  useMessageConfirm()
    .warning("是否切换组织")
    .then(() => {
      useLogin().go();
    });
};
</script>

<style lang="postcss" scoped>
.in-menu {
  @apply flex flex-col h-full transition-width transition-ease transition-duration-300;
  height: calc(100% - var(--in-app-bar-height));
  padding: 8px 8px 0;

  --menu-header-height: 70px;
  --menu-header-bottom: 12px;
  --menu-control-height: 40px;
  --scrollbar-height: calc(
    100vh - var(--in-app-bar-height) - var(--menu-header-height) - var(--menu-header-bottom) -
      var(--menu-control-height)
  );

  & .menu-header {
    @apply flex flex-row items-center box-border cursor-pointer;
    height: var(--menu-header-height);
    border-bottom: 1px solid var(--in-border-color);
    margin-bottom: var(--menu-header-bottom);

    & .logo-image {
      height: 30px;
      width: 30px;
      margin-left: 12px;
    }
    & .right-box {
      @apply flex flex-col items-start;
      margin-left: 12px;
      & .title {
        font-size: 14px;
        color: #171a1d;
        margin-bottom: 2px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        line-height: 1.6;
        width: 140px;
      }
      & .auth-box {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 2px;
        grid-gap: 2px;
        min-height: 18px;
        border: 1px solid rgba(126, 134, 142, 0.16);
        border-radius: 4px;
        padding: 0 4px;
        cursor: default;

        &.authenticated {
          border: 1px solid var(--in-color-primary);
          & .icon {
            color: var(--in-color-primary);
          }

          & .auth {
            color: var(--in-color-primary);
          }
        }

        & .icon {
          color: rgba(23, 26, 29, 0.6);
        }

        & .auth {
          line-height: 16px;
          font-size: 10px;
          color: rgba(23, 26, 29, 0.6);
        }
      }
    }
  }

  & .el-menu {
    --el-menu-bg-color: var(--in-menu-bg-color);
    --el-menu-hover-bg-color: var(--in-menu-bg-hover-color);
    --el-menu-text-color: var(--in-menu-text-color);
    --el-menu-active-color: var(--in-menu-text-active-color);
    --el-menu-base-level-padding: var(--in-menu-base-level-padding);
    --el-menu-item-font-size: var(--in-menu-item-font-size);
  }
  & .el-scrollbar {
    height: var(--scrollbar-height);
  }

  & .menu-control {
    position: absolute;
    bottom: 0;
    left: 0;
    cursor: pointer;
    padding: 0 8px;
    color: rgba(23, 26, 29, 0.6);
    & .content {
      @apply flex flex-row items-center justify-center gap-4;
      border-top: 1px solid var(--in-border-color);
      height: var(--menu-control-height);
      width: 100%;

      & .title {
        font-size: 12px;
      }
      & .icon {
        font-size: 14px;
      }
    }
  }
}

:deep(.el-menu-item) {
  font-weight: bold;
}
:deep(.el-sub-menu) {
  font-weight: bold;
  & .el-menu-item {
    font-weight: 1;
  }
}
:deep(.el-menu-item.is-active) {
  background: var(--in-menu-bg-hover-color);
  border-radius: 4px;
  /* &::before {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 4px;
    content: "";
    background: var(--in-color-primary);
  } */
}
:deep(.el-menu-item:hover) {
  border-radius: 4px;
}
:deep(.el-sub-menu:hover) {
  border-radius: 4px !important;
}
</style>
