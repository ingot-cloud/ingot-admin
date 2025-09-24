<template>
  <in-dialog :title="title" v-model="visible" width="800">
    <in-table
      hide-setting
      :loading="paging.loading.value"
      :data="paging.pageInfo.records"
      :headers="tableHeaders"
      :page="paging.pageInfo"
      ref="tableRef"
      @refresh="paging.exec"
      @handleSizeChange="paging.exec"
      @handleCurrentChange="paging.exec"
      @selectionChange="onSelectChanged"
    >
      <template #toolbar>
        <div gap-2 flex flex-row items-center m-t-10px>
          <el-input
            v-model="paging.condition.nickname"
            clearable
            w-200px
            placeholder="请输入名称"
          ></el-input>
          <in-button @click="paging.exec" type="primary">搜索</in-button>
        </div>
      </template>
      <template #avatar="{ item }">
        <div flex flex-row items-center gap-2>
          <el-image v-if="item.avatar" class="w-30px h-30px" :src="item.avatar" fit="cover" />
          {{ item.nickname }}
        </div>
      </template>
    </in-table>
    <template #footer>
      <in-button type="primary" @click="onConfirmClick" :loading="confirmLoading"> 确定 </in-button>
    </template>
  </in-dialog>
</template>
<script lang="ts" setup>
import { UserPageAPI } from "@/api/org/user";
import type { TableHeaderRecord } from "@/components/table";
import { BindUserAPI } from "@/api/org/role";

const emits = defineEmits(["success"]);

const tableHeaders: Array<TableHeaderRecord> = [
  {
    type: "selection",
    width: "50",
  },
  {
    label: "名称",
    prop: "avatar",
  },
  {
    label: "手机号",
    prop: "phone",
  },
];
const tableRef = ref();
const paging = usePaging(transformPageAPI(UserPageAPI));
const visible = ref(false);
const title = ref("");
const id = ref("");
const bindIds = ref<Array<string>>([]);
const confirmLoading = ref(false);
const message = useMessage();

const onSelectChanged = (value: Array<any>) => {
  bindIds.value = value.map((item) => item.userId);
};

const onConfirmClick = () => {
  if (bindIds.value.length === 0) {
    message.warning("请选择绑定用户");
    return;
  }
  confirmLoading.value = true;
  BindUserAPI({
    id: id.value,
    bindIds: bindIds.value,
  })
    .then(() => {
      message.success("操作成功");
      confirmLoading.value = false;
      visible.value = false;
      emits("success");
    })
    .catch(() => {
      confirmLoading.value = false;
    });
};

defineExpose({
  show: (params: any) => {
    paging.exec();
    id.value = params.id;
    title.value = params.name;
    visible.value = true;
    nextTick(() => {
      tableRef.value.clearSelection();
    });
  },
});
</script>
