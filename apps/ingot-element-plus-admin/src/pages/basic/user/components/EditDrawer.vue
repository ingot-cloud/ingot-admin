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
import { RemoveUserAPI, UserProfileAPI, UpdateUserAPI } from "@/api/basic/user";
import BaseInfoForm from "./BaseInfoForm.vue";
import OrgInfoForm from "./OrgInfoForm.vue";

const emits = defineEmits(["success"]);

const TabNameBase = "1";
const TabNameOrg = "2";
const currentTab = ref(TabNameBase);

const BaseInfoFormRef = ref();
const OrgInfoFormRef = ref();

const user = ref<SysUser>({});
const visible = ref(false);
const loading = ref(false);
const message = useMessage();
const confirmDelete = useConfirmDelete(transformDeleteAPI(RemoveUserAPI), () => {
  visible.value = false;
  emits("success");
});

const handleAddOrgClick = () => {
  OrgInfoFormRef.value.addOrg(user.value.id!);
};

const handleConfirmClick = () => {
  switch (currentTab.value) {
    case TabNameBase:
      BaseInfoFormRef.value
        .getData()
        .then((data: UserDTO) => {
          loading.value = true;
          UpdateUserAPI(data)
            .then(() => {
              loading.value = false;
              visible.value = false;
              message.success("操作成功");
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
  }
};

const handleRemoveClick = () => {
  confirmDelete.exec(user.value.id!, `是否删除用户(${user.value.nickname})`, "删除成功");
};

const fetchData = () => {
  loading.value = true;
  UserProfileAPI(user.value.id!)
    .then((response) => {
      loading.value = false;
      nextTick(() => {
        BaseInfoFormRef.value.setData(user.value.id!, response.data);
        OrgInfoFormRef.value.setData(user.value.id!, response.data);
      });
    })
    .catch(() => {
      loading.value = false;
    });
};

defineExpose({
  show(params: SysUser) {
    user.value = params;
    visible.value = true;
    currentTab.value = TabNameBase;
    fetchData();
    nextTick(() => {
      BaseInfoFormRef.value.init();
    });
  },
});
</script>
