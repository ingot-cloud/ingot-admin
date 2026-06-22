<template>
  <div>
    <in-table :data="appList" :headers="tableHeaders" hideSetting>
      <template #app="{ item }">
        <div flex flex-row items-center gap-2>
          <in-icon
            v-if="item.icon"
            :name="item.icon"
            class="w-[var(--in-menu-icon-size)] h-[var(--in-menu-icon-size)]"
          />
          {{ item.name }}
          <in-tag :value="orgTypeEnums.getTagText(item.appType)" />
        </div>
      </template>
      <template #actions="{ item }">
        <el-switch v-model="item.statusBoolean" :before-change="handleStatusChange(item)" />
      </template>
    </in-table>
  </div>
</template>
<script setup lang="ts">
import type { PlatformApp } from "@/models";
import type { TableHeaderRecord } from "@/components/table";
import { CommonStatus } from "@/models/enums";
import { TenantOrgAppEnabled } from "@/api/platform/org/tenant";
import { useOrgTypeEnums } from "@/models/enums";

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

interface AppItem extends PlatformApp {
  statusBoolean: boolean;
}

const orgTypeEnums = useOrgTypeEnums();

const appList = ref<Array<AppItem>>([]);
const confirm = useMessageConfirm();
const tenantId = ref("");
const handleStatusChange = (params: AppItem) => {
  const actionMessage = params.statusBoolean
    ? `是否禁用应用(${params.name})`
    : `是否开启应用(${params.name})`;
  return () => {
    return new Promise<boolean>((resolve) => {
      confirm
        .warning(actionMessage)
        .then(() => {
          TenantOrgAppEnabled(tenantId.value, {
            id: params.id!,
            enabled: !params.statusBoolean,
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
  setData(tenantIdValue: string, data: Array<PlatformApp>) {
    tenantId.value = tenantIdValue;
    appList.value = data.map((item) => {
      return {
        statusBoolean: item.status == CommonStatus.Enable,
        tenantId: tenantId,
        ...item,
      };
    });
  },
});
</script>
