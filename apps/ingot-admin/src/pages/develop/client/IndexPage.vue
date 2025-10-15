<template>
  <in-filter-container>
    <template #header>
      <div flex flex-row justify-between>
        <in-with-label title="客户端ID">
          <el-input
            v-model="paging.condition.clientId"
            clearable
            style="width: 180px"
            placeholder="请输入客户端ID"
          ></el-input>
        </in-with-label>
        <div>
          <in-button @click="paging.condition.clientId = undefined"> 重置 </in-button>
          <in-button type="primary" :loading="paging.loading.value" @in-click="paging.exec">
            搜索
          </in-button>
        </div>
      </div>
    </template>
    <in-table
      stripe
      :loading="paging.loading.value"
      :data="paging.pageInfo.records"
      :headers="tableHeaders"
      :page="paging.pageInfo"
      @handleSizeChange="paging.exec"
      @handleCurrentChange="paging.exec"
      @refresh="paging.exec"
    >
      <template #toolbar>
        <in-button type="primary" @click="handleCreate()"> 添加客户端 </in-button>
      </template>
      <template #requireProofKey="{ item }">
        <el-tag :type="item.requireProofKey ? 'primary' : 'danger'">
          {{ item.requireProofKey ? "是" : "否" }}
        </el-tag>
      </template>
      <template #accessTokenTimeToLive="{ item }">
        <el-tag> {{ item.accessTokenTimeToLive }}秒 </el-tag>
      </template>
      <template #tokenAuthType="{ item }">
        <in-tag :value="tokenAuthMethodEnum.getTagText(item.tokenAuthType)" />
      </template>
      <template #status="{ item }">
        <common-status-tag :status="item.status" />
      </template>
      <template #actions="{ item }">
        <in-button type="primary" text link @click="handleDetails(item)">
          <template #icon>
            <in-icon name="bx:detail" />
          </template>
          详情
        </in-button>
      </template>
    </in-table>
  </in-filter-container>
  <EditDrawer ref="EditDrawerRef" @success="paging.exec" />
</template>
<script lang="ts" setup>
import { tableHeaders } from "./table";
import type { OAuth2RegisteredClient } from "@/models";
import { useTokenAuthMethodEnum } from "@/models/enums";
import { ClientPageAPI } from "@/api/basic/client";
import EditDrawer from "./EditDrawer.vue";

onMounted(() => {
  paging.exec();
});

const tokenAuthMethodEnum = useTokenAuthMethodEnum();

const EditDrawerRef = ref();
const paging = usePaging(transformPageAPI(ClientPageAPI));

const handleDetails = (item: OAuth2RegisteredClient): void => {
  EditDrawerRef.value?.show(item);
};
const handleCreate = () => {
  EditDrawerRef.value?.show();
};
</script>
