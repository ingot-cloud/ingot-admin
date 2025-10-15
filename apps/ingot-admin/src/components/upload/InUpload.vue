<template>
  <el-upload
    :action="action"
    :limit="limit"
    :accept="accept"
    :on-exceed="handleExceed"
    :disabled="disabled"
    :file-list="innerFileList"
    list-type="picture-card"
    :on-error="handleUploadError"
    :on-success="handleUploadSuccess"
    :http-request="uploadRequest"
  >
    <el-icon><in-icon name="material-symbols:add" /></el-icon>
    <template #file="{ file }">
      <div>
        <img class="el-upload-list__item-thumbnail" :src="handleImageSrc(file)" alt="" />
        <span class="el-upload-list__item-actions">
          <span class="el-upload-list__item-preview" @click="handlePictureCardPreview(file)">
            <el-icon><in-icon name="teenyicons:zoom-in-outline" /></el-icon>
          </span>
          <span v-if="!disabled" class="el-upload-list__item-delete" @click="handleRemove(file)">
            <el-icon><in-icon name="material-symbols:delete" /></el-icon>
          </span>
        </span>
      </div>
    </template>
    <template #tip v-if="tip">
      <div class="el-upload__tip">
        {{ tip }}
      </div>
    </template>
  </el-upload>
  <el-dialog v-model="dialogVisible" flex items-center justify-center fullscreen>
    <img style="height: 80vh" :src="dialogImageUrl" alt="" />
  </el-dialog>
</template>
<script lang="ts" setup>
import type { PropType } from "vue";
import type { UploadFile, UploadUserFile, UploadFiles, UploadRequestOptions } from "element-plus";
import type { UploadAPIFn } from "./types";
import { Message } from "@/utils/message";
import { isString } from "@/utils";

const model = defineModel<string | Array<string>>();
const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  limit: {
    type: Number,
    default: 1,
  },
  accept: {
    type: String,
    default: ".jpg, .png, .jpeg",
  },
  tip: {
    type: String,
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

const dialogImageUrl = ref("");
const dialogVisible = ref(false);
const innerFileList = ref<Array<UploadFile>>([]);
const innerChange = ref(false);
watch(
  model,
  (value) => {
    if (innerChange.value) {
      innerChange.value = false;
      return;
    }
    if (!value || value.length == 0) {
      innerFileList.value = [];
      return;
    }

    const tempValue: Array<string> = [];
    if (isString(value)) {
      tempValue.push(value as string);
    } else {
      tempValue.push(...(value as Array<string>));
    }

    innerFileList.value = tempValue.map((url) => {
      const fileName = url.substring(url.lastIndexOf("/") + 1);
      return {
        url,
        name: fileName,
        status: "success",
        uid: 0,
      } as UploadFile;
    });
  },
  {
    immediate: true,
  },
);

const changeFileList = () => {
  if (!innerFileList.value) {
    innerFileList.value = [];
  }
  innerFileList.value = innerFileList.value.map((item) => {
    if (item.uid === 0) {
      return item;
    }
    let url = item.url;
    if (item.response) {
      url = (item.response as any).data.url;
    }
    return {
      url,
      name: item.name,
      status: item.status,
      uid: item.uid,
    };
  });

  innerChange.value = true;
  if (props.limit === 1) {
    model.value = innerFileList.value[0] ? innerFileList.value[0].url! : "";
  } else {
    model.value = innerFileList.value.map((item) => item.url!) || [];
  }
};
const uploadRequest = (options: UploadRequestOptions): Promise<unknown> => {
  return props.api({
    file: options.file,
    fileName: options.file.name,
  });
};
const handleImageSrc = (file: UploadUserFile) => {
  return file.url;
};
const handleRemove = (file: UploadFile) => {
  if (props.disabled) {
    return;
  }
  const index = innerFileList.value.findIndex((item) => item.url === file.url);
  if (index == -1) {
    return;
  }
  innerFileList.value.splice(index, 1);
  changeFileList();
};
const handlePictureCardPreview = (file: UploadFile) => {
  dialogImageUrl.value = file.url!;
  dialogVisible.value = true;
};
const handleUploadSuccess = (res: any, file: UploadFile, fileList: UploadFiles) => {
  innerFileList.value = fileList;
  changeFileList();
};
const handleUploadError = (error: Error) => {
  Message.error(error.message);
};
const handleExceed = () => {
  Message.error(`最多上传${props.limit}个文件/图片`);
};
</script>
