<template>
  <in-drawer :title="title" v-model="visible" padding="0" :loading="loading">
    <in-biz-tabs v-model="currentTab">
      <in-biz-tab-panel title="基础信息" :name="TabNameBase">
        <BaseInfoForm ref="BaseInfoFormRef" />
      </in-biz-tab-panel>
      <in-biz-tab-panel title="应用信息" :name="TabNameApp">
        <AppInfo ref="AppInfoRef" />
      </in-biz-tab-panel>
    </in-biz-tabs>

    <template #footer>
      <in-button type="danger" v-if="currentTab == TabNameBase" @click="handleRemoveClick">
        删除
      </in-button>
      <in-button :loading="loading" type="primary" @click="handleConfirmClick"> 确定 </in-button>
    </template>
  </in-drawer>
</template>
<script lang="ts" setup>
import type { SysTenant } from "@/models";
import { TenantRemoveAPI, TenantUpdateAPI } from "@/api/platform/org/tenant";
import { fetchTenantOrgApps, tenantQueryKeys } from "@/api/platform/org/tenant.query";
import { Confirm } from "@ingot/admin-core";
import { useQueryClient } from "@tanstack/vue-query";
import BaseInfoForm from "./BaseInfoForm.vue";
import AppInfo from "./AppInfo.vue";

const TabNameBase = "1";
const TabNameApp = "2";
const currentTab = ref(TabNameBase);

const BaseInfoFormRef = ref();
const AppInfoRef = ref();

const emits = defineEmits(["success"]);

const tenant = ref<SysTenant>({});
const loading = ref(false);
const title = ref("编辑组织");
const visible = ref(false);
const queryClient = useQueryClient();
const message = useMessage();

const handleRemoveClick = () => {
  Confirm.warning(`是否删除组织(${tenant.value.name})`).then(() => {
    TenantRemoveAPI(tenant.value.id!).then(() => {
      visible.value = false;
      void queryClient.invalidateQueries({ queryKey: tenantQueryKeys.all });
      message.success("删除成功");
      emits("success");
    });
  });
};

const handleConfirmClick = () => {
  switch (currentTab.value) {
    case TabNameBase:
      BaseInfoFormRef.value
        .getData()
        .then((params: SysTenant) => {
          loading.value = true;
          TenantUpdateAPI(params)
            .then(() => {
              loading.value = false;
              visible.value = false;
              message.success("操作成功");
              void queryClient.invalidateQueries({ queryKey: tenantQueryKeys.all });
              emits("success");
            })
            .catch(() => {
              loading.value = false;
            });
        })
        .catch(() => {
          message.warning("数据未修改");
        });
      break;
    default:
      loading.value = false;
      visible.value = false;
      break;
  }
};

const fetchData = (data: SysTenant) => {
  loading.value = true;
  fetchTenantOrgApps(data.id!)
    .then((response) => {
      loading.value = false;
      nextTick(() => {
        BaseInfoFormRef.value.setData(data);
        AppInfoRef.value.setData(data.id!, response);
      });
    })
    .catch(() => {
      loading.value = false;
    });
};

defineExpose({
  show(data: SysTenant) {
    visible.value = true;
    tenant.value = data;
    currentTab.value = TabNameBase;
    fetchData(data);
  },
});
</script>
