<template>
  <div class="tenant-item">
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
    <div class="icon">
      <i-tabler:arrow-right />
    </div>
  </div>
</template>
<script setup lang="ts">
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
  @apply cursor-pointer;
  min-height: 48px;
  margin-top: 12px;
  padding: 10px;
  background: #f2f2f6;
  border-radius: 8px;
  transition: all 0.3s;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  grid-gap: 10px;

  & .avatar {
    @apply relative overflow-hidden;
    width: 48px;
    height: 48px;
    border-radius: 8px;
    color: #ffffff;
    background: var(--in-color-primary);
  }

  & .avatar-fallback {
    @apply inline-flex items-center justify-center w-full h-full;
    font-size: 28px;
  }

  & .avatar-image {
    position: absolute;
    inset: 0;
    z-index: 1;
    width: 100%;
    height: 100%;
    background: transparent;
  }

  & .name {
    flex: 1;
    display: -webkit-box;
    word-break: break-all;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 14px;
    color: #171a1d;
  }

  & .icon {
    width: 20px;
    height: 20px;
    right: 12px;
    font-size: 20px;
    color: rgba(23, 26, 29, 0.6);
    line-height: 20px;
    text-align: center;
  }
}
</style>
