<template>
  <div class="tenant-item">
    <div class="avatar">
      <el-image v-if="avatar" :src="avatar" class="h-full w-full" fit="cover" />
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
defineProps({
  id: {
    type: [String, Number],
  },
  avatar: {
    type: String,
    default: "",
  },
  name: {
    type: String,
  },
});
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
    width: 48px;
    height: 48px;
    line-height: 48px;
    font-size: 48px;
    text-align: center;
    border-radius: 8px;
    color: rgba(0, 137, 255, 0.48);
    background: #ffffff;
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
