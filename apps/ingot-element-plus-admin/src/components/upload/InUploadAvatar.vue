<template>
  <el-upload
    :action="action"
    :accept="accept"
    :disabled="disabled"
    :show-file-list="false"
    :on-error="handleUploadError"
    :on-success="handleUploadSuccess"
    :http-request="uploadRequest"
  >
    <el-avatar v-if="imageUrl" shape="square" :src="imageUrl" />
    <div v-else class="empty-avatar">
      <el-icon><Plus /></el-icon>
    </div>
  </el-upload>
  <el-dialog v-model="dialogVisible" flex items-center justify-center>
    <img w-full :src="dialogImageUrl" alt="" />
  </el-dialog>
</template>
<script lang="ts" setup>
import type { PropType } from "vue";
import type { UploadFile, UploadFiles, UploadRequestOptions } from "element-plus";
import type { UploadAPIFn } from "./types";
import { Message } from "@/utils/message";
import { Plus } from "@element-plus/icons-vue";

const model = defineModel<string>();
const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  accept: {
    type: String,
    default: ".jpg, .png, .jpeg",
  },
  api: {
    type: Function as PropType<UploadAPIFn>,
    required: true,
  },
  action: {
    type: String,
    default: "",
  },
});

const imageUrl = ref("");
const dialogImageUrl = ref("");
const dialogVisible = ref(false);
const innerChange = ref(false);
watch(
  model,
  (value) => {
    if (innerChange.value) {
      innerChange.value = false;
      return;
    }
    if (!value) {
      imageUrl.value = "";
      return;
    }

    imageUrl.value = value;
  },
  {
    immediate: true,
  },
);

const uploadRequest = (options: UploadRequestOptions): Promise<unknown> => {
  return props.api({
    file: options.file,
    fileName: options.file.name,
  });
};
const handleUploadSuccess = (res: any, file: UploadFile, fileList: UploadFiles) => {
  model.value = res.data.url;
};
const handleUploadError = (error: Error) => {
  Message.error(error.message);
};
</script>
<style scoped lang="postcss">
.empty-avatar {
  @apply flex items-center justify-center;
  height: 40px;
  width: 40px;
  border-radius: 4px;
  border: 1px solid var(--in-border-color);
}
</style>
