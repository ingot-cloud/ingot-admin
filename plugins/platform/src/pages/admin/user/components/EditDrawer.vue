<template>
  <in-drawer :title="user.nickname" v-model="visible" padding="0" :loading="loading">
    <in-biz-tabs v-model="currentTab">
      <in-biz-tab-panel title="基础信息" :name="TabNameBase">
        <BaseInfoForm ref="BaseInfoFormRef" />
      </in-biz-tab-panel>
      <in-biz-tab-panel title="组织信息" :name="TabNameOrg">
        <OrgInfoForm ref="OrgInfoFormRef" />
      </in-biz-tab-panel>
    </in-biz-tabs>
    <template #footer>
      <div v-if="currentTab === TabNameBase">
        <in-button @click="visible = false">取消</in-button>
        <in-button type="danger" @click="handleRemoveClick">删除</in-button>
        <in-button :loading="loading" type="primary" @click="handleConfirmClick"> 确定 </in-button>
      </div>
      <div v-else>
        <in-button type="primary" @click="handleAddOrgClick"> 添加组织 </in-button>
      </div>
    </template>
  </in-drawer>
</template>
<script lang="ts" setup>
import type { UserDTO, SysUser } from "@/models";
import { RemoveUserAPI, UpdateUserAPI } from "@/api/platform/admin/user";
import { PlatformAdminUserProfileQueryOptions } from "@/api/platform/admin/user.query";
import { Confirm } from "@ingot/admin-core";
import BaseInfoForm from "./BaseInfoForm.vue";
import OrgInfoForm from "./OrgInfoForm.vue";
import { useQuery } from "@tanstack/vue-query";

const emits = defineEmits(["success"]);

const TabNameBase = "1";
const TabNameOrg = "2";
const currentTab = ref(TabNameBase);

const BaseInfoFormRef = ref();
const OrgInfoFormRef = ref();

const user = ref<SysUser>({});
const visible = ref(false);
const saving = ref(false);
const message = useMessage();
const profileQuery = useQuery(() => ({
  ...PlatformAdminUserProfileQueryOptions(() => user.value.id ?? ""),
  enabled: visible.value && Boolean(user.value.id),
}));
const loading = computed(() => profileQuery.isFetching.value || saving.value);

const handleAddOrgClick = () => {
  OrgInfoFormRef.value.addOrg(user.value.id!);
};

const handleConfirmClick = () => {
  switch (currentTab.value) {
    case TabNameBase:
      BaseInfoFormRef.value
        .getData()
        .then((data: UserDTO) => {
          saving.value = true;
          UpdateUserAPI(data)
            .then(() => {
              saving.value = false;
              visible.value = false;
              message.success("操作成功");
              emits("success");
            })
            .catch(() => {
              saving.value = false;
            });
        })
        .catch(() => {
          message.warning("数据未修改");
        });
      break;
  }
};

const handleRemoveClick = () => {
  Confirm.warning(`是否删除用户(${user.value.nickname})`).then(() => {
    RemoveUserAPI(user.value.id!).then(() => {
      message.success("删除成功");
      visible.value = false;
      emits("success");
    });
  });
};

watch(
  () => profileQuery.data.value,
  (value) => {
    if (!value || !user.value.id) {
      return;
    }
    BaseInfoFormRef.value?.setData(user.value.id!, value);
  },
  { flush: "post" },
);

defineExpose({
  show(params: SysUser) {
    user.value = params;
    visible.value = true;
    currentTab.value = TabNameBase;
    nextTick(() => {
      BaseInfoFormRef.value.init();
      OrgInfoFormRef.value.setData(params.id!);
    });
  },
});
</script>
