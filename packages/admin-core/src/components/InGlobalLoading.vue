<template>
  <div class="in-global-loading">
    <div class="in-global-loading-box">
      <div class="in-global-loading-box-warp">
        <div class="in-global-loading-box-item"></div>
        <div class="in-global-loading-box-item"></div>
        <div class="in-global-loading-box-item"></div>
        <div class="in-global-loading-box-item"></div>
        <div class="in-global-loading-box-item"></div>
        <div class="in-global-loading-box-item"></div>
        <div class="in-global-loading-box-item"></div>
        <div class="in-global-loading-box-item"></div>
        <div class="in-global-loading-box-item"></div>
      </div>
      <div class="in-global-loading-text">{{ hint }}</div>
    </div>
  </div>
</template>
<script setup lang="ts">
defineProps({
  hint: {
    type: String,
    default: "加载中...",
  },
});
</script>
<style lang="postcss" scoped>
.in-global-loading {
  width: 100%;
  height: 100%;

  & .in-global-loading-box {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    & .in-global-loading-text {
      color: var(--in-color-primary);
      font-size: 14px;
      text-align: center;
      margin-top: 5px;
    }
  }

  & .in-global-loading-box-warp {
    width: 80px;
    height: 80px;
    & .in-global-loading-box-item {
      width: 33.333333%;
      height: 33.333333%;
      background: var(--in-color-primary);
      float: left;
      animation: in-global-loading-animation 1.2s infinite ease;
      border-radius: 1px;
    }
    & .in-global-loading-box-item:nth-child(7) {
      animation-delay: 0s;
    }
    & .in-global-loading-box-item:nth-child(4) {
      animation-delay: 0.1s;
    }
    & .in-global-loading-box-item:nth-child(8) {
      animation-delay: 0.1s;
    }

    & .in-global-loading-box-item:nth-child(1) {
      animation-delay: 0.2s;
    }
    & .in-global-loading-box-item:nth-child(5) {
      animation-delay: 0.2s;
    }
    & .in-global-loading-box-item:nth-child(9) {
      animation-delay: 0.2s;
    }

    & .in-global-loading-box-item:nth-child(2) {
      animation-delay: 0.3s;
    }
    & .in-global-loading-box-item:nth-child(6) {
      animation-delay: 0.3s;
    }

    & .in-global-loading-box-item:nth-child(3) {
      animation-delay: 0.4s;
    }
  }
}

@keyframes in-global-loading-animation {
  0%,
  70%,
  100% {
    transform: scale3D(1, 1, 1);
  }
  35% {
    transform: scale3D(0, 0, 1);
  }
}
</style>
