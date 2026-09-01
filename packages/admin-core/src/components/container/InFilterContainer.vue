<template>
  <!-- 过滤容器主结构 -->
  <div class="in-filter-container">
    <!-- 顶部标题区域 -->
    <div
      class="in-filter-container-header"
      :class="{ 'sticky-header': stickyHeader }"
      v-if="slot.header"
    >
      <slot name="header"></slot>
    </div>

    <!-- 左右布局容器 -->
    <div class="in-filter-container-left-right">
      <!-- 左侧边栏区域 -->
      <div class="left-filter" v-if="slot.left">
        <slot name="left"></slot>
      </div>

      <!-- 右侧主要内容区域 -->
      <el-container class="in-filter-container-right">
        <!-- 顶部过滤条件区域 -->
        <div class="top-filter" v-if="slot.top">
          <slot name="top"></slot>
        </div>

        <!-- 内部滚动容器 -->
        <div class="inner-container">
          <!-- 默认插槽放置主要内容 -->
          <slot />
        </div>
      </el-container>
    </div>

    <!-- 返回顶部按钮 -->
    <el-backtop v-if="showBacktop" target=".in-filter-container" :right="60" :bottom="60">
      <div flex items-center justify-center>
        <i-material-symbols:vertical-align-top-rounded />
      </div>
    </el-backtop>
  </div>
</template>

<script lang="ts" setup>
// 组件属性定义
defineProps({
  // 是否显示返回顶部按钮
  showBacktop: {
    type: Boolean,
    default: true,
  },
  stickyHeader: {
    type: Boolean,
    default: true,
  },
});

// 插槽检测，用于条件渲染插槽区域
const slot = useSlots();
</script>

<style lang="postcss" scoped>
.in-filter-container {
  @apply w-full h-full flex flex-col bg-[var(--in-bg-color)] overflow-x-hidden;
  border-radius: var(--in-common-border-radius);
  position: relative;

  /* 头部样式 */
  & .in-filter-container-header {
    @apply p-[var(--in-common-padding)] bg-[var(--in-bg-color)];
    border-bottom: 1px solid var(--in-border-color); /* 底部分割线 */
  }
  & .in-filter-container-header.sticky-header {
    position: sticky;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
  }

  /* 左右布局容器样式 */
  & .in-filter-container-left-right {
    @apply flex flex-row;
    flex: 1; /* 撑满剩余空间 */
  }

  /* 左侧边栏样式 */
  & .left-filter {
    @apply p-[var(--in-common-padding)];
    border-right: 1px solid var(--in-border-color); /* 右侧分割线 */
  }

  /* 右侧内容区域 */
  & .in-filter-container-right {
    @apply flex flex-col;

    /* 顶部过滤条件样式 */
    & .top-filter {
      @apply p-[var(--in-common-padding)];
      border-bottom: 1px solid var(--in-border-color); /* 底部分割线 */
    }

    /* 内部滚动容器 */
    & .inner-container {
      @apply flex-1 box-border overflow-x-hidden p-[var(--in-common-padding)];
      /* 弹性布局撑满空间 + 内边距 */
    }
  }
}
</style>
