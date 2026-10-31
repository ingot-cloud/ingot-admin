<template>
  <button type="button" class="tenant-item" :title="name">
    <div class="avatar">
      <span class="avatar-fallback" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
          <path d="M0 0h24v24H0z" fill="none" />
          <g fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M5 22a3 3 0 1 1 0-6a3 3 0 0 1 0 6Zm14 0a3 3 0 1 1 0-6a3 3 0 0 1 0 6Z" />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M19 16c-.183-2.453-1.203-3-4.653-3H9.653c-3.45 0-4.47.547-4.653 3"
            />
            <path d="M12 10a4 4 0 1 1 0-8a4 4 0 0 1 0 8Z" />
          </g>
        </svg>
      </span>
      <el-image
        v-if="showImage"
        :src="avatar"
        class="avatar-image"
        fit="cover"
        @error="privateOnImageError"
      >
        <template #placeholder>
          <span />
        </template>
        <template #error>
          <span />
        </template>
      </el-image>
    </div>
    <div class="name">
      {{ name }}
    </div>
    <div class="icon" aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
        <path
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M5 12h14m-6-6l6 6l-6 6"
        />
      </svg>
    </div>
  </button>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { ElImage } from "element-plus";

const props = withDefaults(
  defineProps<{
    id?: string | number;
    avatar?: string;
    name?: string;
  }>(),
  {
    avatar: "",
  },
);

const imageFailed = ref(false);
const showImage = computed(() => Boolean(props.avatar) && !imageFailed.value);

watch(
  () => props.avatar,
  () => {
    imageFailed.value = false;
  },
);

const privateOnImageError = (): void => {
  imageFailed.value = true;
};
</script>

<style scoped lang="postcss">
.tenant-item {
  display: flex;
  align-items: center;
  gap: var(--in-space-3);
  width: 100%;
  min-height: 68px;
  padding: var(--in-space-3);
  border: 1px solid var(--in-border-color-light);
  border-radius: var(--in-radius-card);
  background: var(--in-bg-color-surface);
  color: var(--in-text-color);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    border-color var(--in-motion-duration),
    background-color var(--in-motion-duration);

  &:hover {
    border-color: var(--in-color-primary);
    background: color-mix(in srgb, var(--in-color-primary) 5%, var(--in-bg-color-surface));
  }

  & .avatar {
    position: relative;
    flex: none;
    overflow: hidden;
    width: 40px;
    height: 40px;
    border-radius: var(--in-radius-card);
    color: var(--in-color-primary);
    background: var(--in-auth-brand-glow);
  }

  & .avatar-fallback {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    font-size: 24px;
  }

  & .avatar-image {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  & .name {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
    font-size: var(--in-font-size-body);
    line-height: var(--in-line-height-body);
  }

  & .icon {
    display: inline-flex;
    flex: none;
    width: 16px;
    height: 16px;
    color: var(--in-text-color-placeholder);
    font-size: 16px;
  }
}
</style>
