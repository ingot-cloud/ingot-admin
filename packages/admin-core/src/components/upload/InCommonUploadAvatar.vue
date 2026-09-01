<template>
  <in-upload-avatar :api="commonApi" />
</template>
<script setup lang="ts">
import type { UploadRequestParams } from "./types";
import { UploadAPI } from "@/api/common/oss";

const props = defineProps({
  dir: {
    type: String,
    default: "",
  },
});

const commonApi = (params: UploadRequestParams) => {
  params.fileName = props.dir ? `${props.dir}/${params.fileName}` : params.fileName;
  return UploadAPI(params);
};
</script>
