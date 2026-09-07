<template>
  <div class="in-detail-identity">
    <div class="in-detail-identity__main">
      <el-upload
        v-if="editable"
        class="in-detail-identity__uploader"
        :show-file-list="false"
        :accept="accept"
        :http-request="privateUploadRequest"
        :on-success="privateOnUploadSuccess"
        :on-error="privateOnUploadError"
      >
        <span class="in-detail-identity__avatar is-editable">
          <in-avatar :src="displaySrc" :name="name" size="lg" :show-name="false" />
          <span class="in-detail-identity__avatar-mask">
            <icon-camera class="in-detail-identity__camera" />
          </span>
        </span>
      </el-upload>
      <in-avatar v-else :src="displaySrc" :name="name" size="lg" :show-name="false" />
      <div class="in-detail-identity__meta">
        <span class="in-detail-identity__name">{{ name }}</span>
        <div v-if="slots.status" class="in-detail-identity__status">
          <slot name="status" />
        </div>
      </div>
    </div>
    <div v-if="slots.more" class="in-detail-identity__more">
      <slot name="more" />
    </div>
  </div>
</template>
<script lang="ts" setup>
import type { UploadRequestOptions } from "element-plus";
import type { R, OSSResult } from "@/models";
import { UploadAPI } from "@/api/common/oss";
import { Message } from "@/utils/message";
import InAvatar from "../avatar/InAvatar.vue";
import IconCamera from "../icons/IconCamera.vue";

defineOptions({
  name: "InDetailIdentity",
});

const avatarModel = defineModel<string | undefined>("avatar");

const props = withDefaults(
  defineProps<{
    name?: string;
    src?: string;
    editable?: boolean;
    uploadDir?: string;
    accept?: string;
  }>(),
  {
    accept: ".jpg, .png, .jpeg",
  },
);

const slots = defineSlots<{
  status?: () => unknown;
  more?: () => unknown;
}>();

const displaySrc = computed(() => avatarModel.value || props.src || "");

const privateUploadRequest = (options: UploadRequestOptions): Promise<R<OSSResult>> => {
  const fileName = props.uploadDir ? `${props.uploadDir}/${options.file.name}` : options.file.name;
  return UploadAPI({
    file: options.file,
    fileName,
  });
};

const privateOnUploadSuccess = (res: R<OSSResult>): void => {
  const url = res.data?.url;
  if (!url) {
    return;
  }
  avatarModel.value = url;
};

const privateOnUploadError = (error: Error): void => {
  Message.error(error.message);
};
</script>
<style lang="postcss" scoped>
.in-detail-identity {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: var(--in-space-4);
  padding: var(--in-space-5);
}

.in-detail-identity__main {
  display: flex;
  flex-direction: row;
  align-items: center;
  min-width: 0;
  gap: var(--in-space-3);
}

.in-detail-identity__uploader {
  display: inline-flex;
  line-height: 0;
}

.in-detail-identity__uploader :deep(.el-upload) {
  display: inline-flex;
  border: 0;
  background: transparent;
}

.in-detail-identity__avatar {
  position: relative;
  display: inline-flex;
  border-radius: 50%;
  overflow: hidden;
}

.in-detail-identity__avatar.is-editable {
  cursor: pointer;
}

.in-detail-identity__avatar-mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--in-overlay-mask);
  color: var(--in-text-color-inverse);
  opacity: 0;
  transition: opacity var(--in-motion-duration) var(--in-motion-ease);
}

.in-detail-identity__avatar.is-editable:hover .in-detail-identity__avatar-mask {
  opacity: 1;
}

.in-detail-identity__camera {
  width: 20px;
  height: 20px;
}

.in-detail-identity__meta {
  display: flex;
  flex-direction: row;
  align-items: center;
  min-width: 0;
  gap: var(--in-space-2);
}

.in-detail-identity__name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--in-text-color);
  font-size: var(--in-font-size-section-title);
  font-weight: var(--in-font-weight-section-title);
  line-height: var(--in-line-height-section-title);
}

.in-detail-identity__status {
  flex-shrink: 0;
}

.in-detail-identity__more {
  flex-shrink: 0;
}
</style>
