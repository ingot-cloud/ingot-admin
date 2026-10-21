<template>
  <in-page-frame mode="contained" surface="workspace">
    <template #header>
      <in-page-header :title="DOWNLOAD_CENTER_TITLE" description="导出文件保留 7 天，过期后需重新导出。" />
    </template>
    <in-table
      :loading="loading"
      :data="pageInfo.records"
      :headers="downloadTableHeaders"
      :page="pageInfo"
      row-key="id"
      @handleSizeChange="fetchData"
      @handleCurrentChange="fetchData"
    >
      <template #title>下载记录</template>
      <template #empty>
        <el-empty :image="emptyIllustration" description="暂无下载记录" />
      </template>
      <template #filename="{ item }">
        <div class="download-center__file">
          <span>{{ item.filename || item.title }}</span>
          <span
            v-if="item.status === DownloadTaskStatus.FAILED && item.failureReason"
            class="download-center__reason"
          >
            {{ item.failureReason }}
          </span>
        </div>
      </template>
      <template #status="{ item }">
        <in-tag-enum :value="item.status" :enumObj="statusEnum" />
      </template>
      <template #actions="{ item }">
        <in-button
          v-if="item.status === DownloadTaskStatus.SUCCEEDED"
          link
          type="primary"
          :loading="linkingId === item.id"
          @in-click="download(item)"
        >
          下载
        </in-button>
        <span v-else>-</span>
      </template>
    </in-table>
  </in-page-frame>
</template>

<script setup lang="ts">
import { emptyIllustration } from "@/components/table/emptyIllustration";
import { useEnum } from "@/hooks/biz/useEnum";
import {
  DOWNLOAD_CENTER_TITLE,
  DownloadTaskStatus,
  DownloadTaskStatusEnumExtArray,
} from "@/models/download";
import { downloadTableHeaders } from "./table";
import { useOps } from "./useOps";

defineOptions({ name: "DownloadCenterPage" });

const statusEnum = useEnum(DownloadTaskStatusEnumExtArray);
const { loading, pageInfo, fetchData, linkingId, download } = useOps();
</script>

<style scoped lang="postcss">
.download-center__file {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.download-center__reason {
  font-size: var(--el-font-size-extra-small);
  color: var(--el-color-danger);
}
</style>
