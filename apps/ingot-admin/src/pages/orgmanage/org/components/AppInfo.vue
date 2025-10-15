<template>
  <div>
    <in-table :data="appList" :headers="tableHeaders" hideSetting>
      <template #app="{ item }">
        <div flex flex-row items-center gap-2>
          <in-icon
            v-if="item.menuIcon"
            :name="item.menuIcon"
            class="w-[var(--in-menu-icon-size)] h-[var(--in-menu-icon-size)]"
          />
          {{ item.menuName }}
        </div>
      </template>
      <template #actions="{ item }">
        <el-switch v-model="item.statusBoolean" :before-change="handleStatusChange(item)" />
      </template>
    </in-table>
  </div>
</template>
<script setup lang="ts">
import type { ApplicationOrgPageItemVO } from "@/models";
import type { TableHeaderRecord } from "@/components/table";
import { CommonStatus } from "@/models/enums";
import { UpdateOrgAppStatusAPI } from "@/api/basic/application";

const tableHeaders: Array<TableHeaderRecord> = [
  {
    label: "应用",
    prop: "app",
    align: "center",
  },
  {
    label: "操作",
    prop: "actions",
    fixed: "right",
    align: "center",
  },
];

interface AppItem extends ApplicationOrgPageItemVO {
  statusBoolean: boolean;
}

const appList = ref<Array<AppItem>>([]);
const confirm = useMessageConfirm();

const handleStatusChange = (params: AppItem) => {
  const actionMessage = params.statusBoolean
    ? `是否禁用应用(${params.menuName})`
    : `是否开启应用(${params.menuName})`;
  return () => {
    return new Promise<boolean>((resolve) => {
      confirm
        .warning(actionMessage)
        .then(() => {
          UpdateOrgAppStatusAPI(params.tenantId!, {
            id: params.id,
            status: params.statusBoolean ? CommonStatus.Lock : CommonStatus.Enable,
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

defineExpose({
  setData(data: Array<ApplicationOrgPageItemVO>) {
    appList.value = data.map((item) => {
      return {
        statusBoolean: item.status == CommonStatus.Enable,
        ...item,
      };
    });
  },
});
</script>
