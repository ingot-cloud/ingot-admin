<template>
  <in-filter-container>
    <template #header>
      <in-filter-item>
        <in-with-label title="应用类型">
          <in-select
            class="w-120px!"
            v-model="condition.appType"
            placeholder="全部类型"
            :options="appTypeEnum.getOptions()"
            @change="fetchData()"
            clearable
          />
        </in-with-label>
        <in-with-label title="状态">
          <in-select
            class="w-120px!"
            v-model="condition.status"
            placeholder="全部状态"
            :options="statusEnum.getOptions()"
            clearable
          />
        </in-with-label>
        <in-with-label title="名称">
          <el-input
            class="w-200px"
            v-model="condition.name"
            clearable
            placeholder="搜索应用名称"
            @keyup.enter="privateOnSearch"
          />
        </in-with-label>
        <template #rightActions>
          <in-button @click="resetFilter">重置</in-button>
          <in-button type="primary" :loading="loading" @in-click="privateOnSearch">搜索</in-button>
        </template>
      </in-filter-item>
    </template>

    <in-table
      :loading="loading"
      :data="pageInfo.records"
      :page="pageInfo"
      :headers="tableHeaders"
      ref="tableRef"
      @refresh="fetchData"
      @handleSizeChange="fetchData"
      @handleCurrentChange="fetchData"
    >
      <template #title>应用管理</template>
      <template #toolbar>
        <in-button type="primary" @click="privateOnCreate">
          <template #icon>
            <i-ep:plus />
          </template>
          添加应用
        </in-button>
      </template>
      <template #name="{ item }">
        <div flex flex-row items-center gap-8px>
          <in-icon
            v-if="item.icon"
            :name="item.icon"
            class="w-[var(--in-menu-icon-size)] h-[var(--in-menu-icon-size)]"
          />
          <in-button text link type="primary" @click="privateOnDetail(item)">
            {{ item.name }}
          </in-button>
        </div>
      </template>
      <template #code="{ item }">
        <in-copy-tag :text="item.code" />
      </template>
      <template #appType="{ item }">
        <in-tag-enum :value="item.appType" :enumObj="appTypeEnum" />
      </template>
      <template #status="{ item }">
        <common-status-tag :status="item.status" />
      </template>
      <template #actions="{ item }">
        <div flex flex-row items-center justify-center gap-8px>
          <in-button type="primary" text link @click="privateOnDetail(item)">
            <template #icon>
              <i-mdi:card-account-details-outline />
            </template>
            详情
          </in-button>
          <common-status-button
            text
            link
            :status="item.status"
            @click="privateOnStatusChange(item)"
          />
          <in-button-delete @click="privateOnRemove(item)" />
        </div>
      </template>
    </in-table>
  </in-filter-container>

  <CreateDrawer ref="createDrawerRef" @success="privateOnCreateSuccess" />
</template>

<script setup lang="ts">
import type { PlatformApp } from "@/models";
import type { TableAPI } from "@/components/table";
import type { CommonStatus } from "@/models/enums";
import { CommonStatusEnumExtArray, useAppTypeEnum } from "@/models/enums";
import { PatchAppStatusAPI, RemoveAppAPI } from "@/api/platform/config/app.ts";
import { useOps } from "./useOps";
import { tableHeaders } from "./table";
import CreateDrawer from "./components/CreateDrawer.vue";
import { useUserInfoStore } from "@/stores/modules/auth";
import { StatusCode } from "@/net/status-code";

const { getIsSystemAdmin } = storeToRefs(useUserInfoStore());
const { loading, condition, pageInfo, resetFilter, fetchData } = useOps();

const appTypeEnum = useAppTypeEnum();
const statusEnum = useEnum(CommonStatusEnumExtArray);
const message = useMessage();
const confirm = useMessageConfirm();
const go = useGo();

const createDrawerRef = ref<InstanceType<typeof CreateDrawer>>();
const tableRef = ref<TableAPI>();

const patchAppStatus = (record: { id: string; status: CommonStatus | string }) => {
  return PatchAppStatusAPI(record.id, record.status);
};

const confirmStatus = useConfirmStatus(transformUpdateAPI(patchAppStatus), () => fetchData());

const privateOnSearch = (): void => {
  fetchData();
};

const privateOnCreate = (): void => {
  createDrawerRef.value?.show();
};

const privateOnCreateSuccess = (appId?: string): void => {
  if (!appId) {
    return;
  }
  privateGoDetail(appId);
};

const privateOnDetail = (app: PlatformApp): void => {
  if (!app.id) {
    return;
  }
  privateGoDetail(app.id);
};

const privateGoDetail = (appId: string): void => {
  go({ path: `/platform/config/app/detail/${appId}` });
};

const privateOnStatusChange = (app: PlatformApp): void => {
  confirmStatus.exec(app.id!, app.status as CommonStatus, `应用(${app.name})`, "操作成功");
};

const privateOnRemove = (app: PlatformApp): void => {
  confirm.warning(`是否删除应用(${app.name})?`).then(() => {
    RemoveAppAPI(app.id!)
      .then(() => {
        message.success("操作成功");
        fetchData();
      })
      .catch((error) => {
        if (getIsSystemAdmin.value && error.code === StatusCode.ILLEGAL_OPERATION) {
          confirm
            .warning(`应用存在子菜单或子权限或已经授权给其他租户，是否强制删除应用(${app.name})?`)
            .then(() => {
              RemoveAppAPI(app.id!, true).then(() => {
                message.success("操作成功");
                fetchData();
              });
            });
        }
      });
  });
};

onMounted(() => {
  fetchData();
});
</script>
