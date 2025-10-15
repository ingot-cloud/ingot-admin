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
            v-if="item.menuIcon"
            :name="item.menuIcon"
            class="w-[var(--in-menu-icon-size)] h-[var(--in-menu-icon-size)]"
          />
          {{ item.menuName }}
        </div>
      </template>
      <template #defaultApp="{ item }">
        <div flex flex-row items-center gap-2>
          <el-switch v-model="item.defaultApp" :before-change="handleDefaultChange(item)" />
          <in-tag
            :value="
              item.defaultApp
                ? { tag: 'success', text: '已开启' }
                : { tag: 'danger', text: '未开启' }
            "
          />
        </div>
      </template>
      <template #status="{ item }">
        <common-status-tag :status="item.status" />
      </template>
      <template #actions="{ item }">
        <in-button link text type="warning" @click="handleSyncApplication(item)">
          <template #icon>
            <el-icon>
              <in-icon name="material-symbols:sync" />
            </el-icon>
          </template>
          同步
        </in-button>
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
  <EditDrawer
    ref="EditDrawerRef"
    :authorityData="authorityData"
    :menuData="menuData"
    @success="paging.exec"
  />
</template>
<script lang="ts" setup>
import { tableHeaders } from "./table";
import type { AuthorityTreeNode, MenuTreeNode, ApplicationPageItemVO } from "@/models";
import { OrgTypeEnums } from "@/models/enums";
import EditDrawer from "./EditDrawer.vue";
import type { TableAPI } from "@/components/table";
import { GetMenuTreeAPI } from "@/api/basic/menu";
import {
  ApplicationPageAPI,
  UpdateAppStatusAPI,
  UpdateAppDefaultAPI,
  RemoveAppAPI,
  SyncApplication,
} from "@/api/basic/application";
import { useAuthorityStore } from "@/stores/modules/authority";

onMounted(() => {
  paging.exec();
  // 只获取组织类型的数据
  authorityStore.fetchAuthorityTree({ orgTypeText: OrgTypeEnums.Tenant }).then((data) => {
    authorityData.value = data;
  });
  GetMenuTreeAPI({ orgTypeText: OrgTypeEnums.Tenant }).then((response) => {
    const data = response.data;
    menuData.value = data;
  });
});

const message = useMessage();
const confirm = useMessageConfirm();
const paging = usePaging(transformPageAPI(ApplicationPageAPI));
const confirmStatus = useConfirmStatus(transformUpdateAPI(UpdateAppStatusAPI), () => paging.exec());

const EditDrawerRef = ref();
const tableRef = ref<TableAPI>();

const authorityStore = useAuthorityStore();
const authorityData = ref<Array<AuthorityTreeNode>>();
const menuData = ref<Array<MenuTreeNode>>([]);

const handleCreate = (): void => {
  EditDrawerRef.value?.show();
};

const handleSyncApplication = (params: ApplicationPageItemVO) => {
  confirm.warning("是否同步该应用信息到所有组织?").then(() => {
    paging.loading.value = true;
    SyncApplication(params.id!)
      .then(() => {
        paging.loading.value = false;
      })
      .catch(() => {
        paging.loading.value = false;
      });
  });
};

const handleDefaultChange = (params: ApplicationPageItemVO) => {
  const actionMessage = params.defaultApp
    ? `是否取消应用(${params.menuName})默认设置`
    : `是否将应用(${params.menuName})设置为默认`;
  return () => {
    return new Promise<boolean>((resolve) => {
      confirm
        .warning(actionMessage)
        .then(() => {
          UpdateAppDefaultAPI({
            id: params.id,
            defaultApp: !params.defaultApp,
          })
            .then(() => {
              resolve(true);
            })
            .catch(() => {
              resolve(false);
            });
        })
        .catch(() => {
          resolve(false);
        });
    });
  };
};

const handleRemove = (params: ApplicationPageItemVO) => {
  confirm.warning(`是否删除应用(${params.menuName})?`).then(() => {
    RemoveAppAPI(params.id!).then(() => {
      message.success("操作成功");
      paging.exec();
    });
  });
};
</script>
