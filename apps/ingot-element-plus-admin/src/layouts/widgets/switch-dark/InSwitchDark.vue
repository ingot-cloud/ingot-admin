<script setup lang="ts">
import { useToggle, useDark } from "@vueuse/core";
import IconDark from "@/components/icons/IconDark.vue";
import IconLight from "@/components/icons/IconLight.vue";
const isDark = useDark();
const toggleDark = useToggle(isDark);
</script>

<template>
  <button class="in-switch-dark" @click="toggleDark()">
    <div class="in-switch-dark__action">
      <div class="in-switch-dark__icon">
        <ElIcon :size="13">
          <IconDark class="in-switch-dark-dark-icon" />
          <IconLight class="in-switch-dark-light-icon" />
        </ElIcon>
      </div>
    </div>
  </button>
</template>

<style lang="postcss" scoped>
.in-switch-dark {
  margin: 0;
  display: inline-block;
  position: relative;
  width: 40px;
  height: 20px;
  border: 1px solid var(--in-border-color);
  outline: none;
  border-radius: 10px;
  box-sizing: border-box;
  background: var(--in-bg-color-mute);
  cursor: pointer;
  transition:
    border-color var(--in-transition-duration),
    background-color var(--in-transition-duration);

  &:hover {
    border-color: var(--in-border-color-light);
  }

  & .in-switch-dark__action {
    position: absolute;
    top: 1px;
    left: 1px;
    border-radius: 50%;
    background-color: var(--in-bg-color);
    transform: translateX(0);
    color: var(--in-text-color-light);
    transition:
      border-color var(--in-transition-duration),
      background-color var(--in-transition-duration),
      transform var(--in-transition-duration);
  }

  & .in-switch-dark__icon {
    position: relative;

    & .el-icon {
      cursor: pointer;
      position: absolute;
      left: 1px;
      bottom: 1px;
    }
  }

  & .in-switch-dark__action,
  & .in-switch-dark__icon {
    width: 16px;
    height: 16px;
  }

  &:focus-visible {
    outline: -webkit-focus-ring-color auto 1px;
    outline-offset: 1px;
  }
}

.in-switch-dark-dark-icon,
.in-switch-dark-light-icon {
  transition:
    color var(--in-transition-duration),
    opacity var(--in-transition-duration);
}

.in-switch-dark-light-icon {
  opacity: 1;
  position: absolute;
  top: 0;
  left: 0;
}

.in-switch-dark-dark-icon {
  opacity: 0;
  position: absolute;
  top: 0;
  left: 0;
}

html.dark {
  & .in-switch-dark {
    & .in-switch-dark__action {
      transform: translateX(20px);
    }
  }
  & .in-switch-dark-dark-icon {
    opacity: 1;
  }

  & .in-switch-dark-light-icon {
    opacity: 0;
  }
}
</style>
