<template>
  <in-filter-container>
    <template #header>
      <in-filter-item>
        <in-with-label title="姓名">
          <el-input
            v-model="ops.condition.nickname"
            clearable
            style="width: 200px"
            placeholder="请输入姓名"
          ></el-input>
        </in-with-label>
        <in-with-label title="手机号">
          <el-input
            v-model="ops.condition.phone"
            clearable
            style="width: 200px"
            placeholder="请输入手机号"
          ></el-input>
        </in-with-label>

        <template #rightActions>
          <in-button @click="ops.resetFilter"> 重置 </in-button>
          <in-button type="primary" :loading="ops.loading.value" @click="ops.fetchUserData">
            搜索
          </in-button>
        </template>
      </in-filter-item>
    </template>

    <in-table
      :loading="ops.loading.value"
      :data="ops.pageInfo.records"
      :headers="tableHeaders"
      :page="ops.pageInfo"
      ref="tableRef"
      @refresh="ops.fetchUserData"
      @handleSizeChange="ops.fetchUserData"
      @handleCurrentChange="ops.fetchUserData"
    >
      <template #title> 系统用户管理 </template>
      <template #toolbar>
        <in-button type="primary" @click="handleCreateUser"> 添加用户 </in-button>
      </template>
      <template #avatar="{ item }">
        <div flex flex-row items-center gap-2>
          <el-image v-if="item.avatar" class="w-30px h-30px" :src="item.avatar" fit="cover" />
          <in-button text link @click="handleDetailUser(item)">
            {{ item.nickname }}
          </in-button>
        </div>
      </template>
      <template #username="{ item }">
        <in-copy-tag :text="item.username" />
      </template>
      <template #status="{ item }">
        <common-status-tag :status="item.status" />
      </template>
      <template #actions="{ item }">
        <in-button link text type="primary" @click="handleDetailUser(item)">
          <template #icon>
            <i-mdi:card-account-details-outline />
          </template>
          详情
        </in-button>
        <common-status-button
          text
          link
          :status="item.status"
          @click="ops.handleDisableUser(item)"
        />
        <in-button link text type="danger" @click="handleResetPwdUser(item)">
          <template #icon>
            <in-icon name="carbon:password" />
          </template>
          重置密码
        </in-button>
      </template>
    </in-table>
  </in-filter-container>

  <CreateDrawer ref="CreateDrawerRef" @success="ops.fetchUserData" />
  <EditDrawer ref="EditDrawerRef" @success="ops.fetchUserData" />
  <ResetPwdDialog ref="ResetPwdDialogRef" />
</template>

<script lang="ts" setup>
import type { TableAPI } from "@/components/table";
import type { SysUser } from "@/models";
import { useOps } from "./useOps";
import { tableHeaders } from "./table";
import CreateDrawer from "./components/CreateDrawer.vue";
import EditDrawer from "./components/EditDrawer.vue";
import ResetPwdDialog from "./components/ResetPwdDialog.vue";
import { UserResetPwdAPI } from "@/api/platform/system/user";

const ops = useOps();

const CreateDrawerRef = ref();
const EditDrawerRef = ref();
const ResetPwdDialogRef = ref();
const tableRef = ref<TableAPI>();
const confirm = useMessageConfirm();
const message = useMessage();

const handleCreateUser = (): void => {
  CreateDrawerRef.value?.show();
};

const handleDetailUser = (params: SysUser): void => {
  EditDrawerRef.value.show(params);
};

const handleResetPwdUser = (params: SysUser): void => {
  confirm.warning(`是否重置该用户(${params.nickname})密码`).then(() => {
    UserResetPwdAPI(params.id!).then((response) => {
      message.success("操作成功");
      ResetPwdDialogRef.value.show(response.data.random);
    });
  });
};

onMounted(() => {
  ops.fetchUserData();
});
</script>
