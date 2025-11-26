<template>
  <in-container>
    <in-table
      :loading="paging.loading.value"
      :data="paging.pageInfo.records"
      :page="paging.pageInfo"
      :headers="tableHeaders"
      @refresh="paging.exec"
      @handleSizeChange="paging.exec"
      @handleCurrentChange="paging.exec"
      ref="tableRef"
    >
      <template #title> 应用管理 </template>
      <template #toolbar>
        <in-button type="primary" @click="handleCreate"> 添加应用 </in-button>
      </template>
      <template #menuName="{ item }">
        <div flex flex-row items-center gap-2>
          <in-icon
            v-if="item.icon"
            :name="item.icon"
            class="w-[var(--in-menu-icon-size)] h-[var(--in-menu-icon-size)]"
          />
          {{ item.name }}
        </div>
      </template>
      <template #status="{ item }">
        <common-status-tag :status="item.status" />
      </template>
      <template #actions="{ item }">
        <common-status-button
          text
          link
          :status="item.status"
          @click="confirmStatus.exec(item.id, item.status, `应用(${item.menuName})`, '操作成功')"
        />
        <in-button-delete @click="handleRemove(item)">删除</in-button-delete>
      </template>
    </in-table>
  </in-container>
  <EditDrawer ref="EditDrawerRef" :menuData="menuData" @success="paging.exec" />
</template>
<script lang="ts" setup>
import { tableHeaders } from "./table";
import type { MenuTreeNode, MetaApp } from "@/models";
import { OrgTypeEnums } from "@/models/enums";
import EditDrawer from "./EditDrawer.vue";
import type { TableAPI } from "@/components/table";
import { GetMenuTreeAPI } from "@/api/platform/meta/menu";
import { GetAppPageAPI, UpdateAppAPI, RemoveAppAPI } from "@/api/platform/meta/app";

onMounted(() => {
  paging.exec();
  GetMenuTreeAPI({ orgType: OrgTypeEnums.Tenant }).then((response) => {
    const data = response.data;
    menuData.value = data;
  });
});

const message = useMessage();
const confirm = useMessageConfirm();
const paging = usePaging(transformPageAPI(GetAppPageAPI));
const confirmStatus = useConfirmStatus(transformUpdateAPI(UpdateAppAPI), () => paging.exec());

const EditDrawerRef = ref();
const tableRef = ref<TableAPI>();

const menuData = ref<Array<MenuTreeNode>>([]);

const handleCreate = (): void => {
  EditDrawerRef.value?.show();
};

const handleRemove = (params: MetaApp) => {
  confirm.warning(`是否删除应用(${params.name})?`).then(() => {
    RemoveAppAPI(params.id!).then(() => {
      message.success("操作成功");
      paging.exec();
    });
  });
};
</script>
