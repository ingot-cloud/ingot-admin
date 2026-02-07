<template>
  <in-filter-container>
    <in-table
      :loading="loading"
      :data="data"
      ref="TableRef"
      :headers="tableHeaders"
      @refresh="refreshData"
    >
      <template #title> 凭证策略管理 </template>
      <template #toolbar>
        <in-button type="primary" @click="handleCreate()"> 添加 </in-button>
      </template>
      <template #policyType="{ item }">
        <in-button text link @click="handleEdit(item)">
          <in-tag :value="credentialPolicyTypeEnum.getTagText(item.policyType)" />
        </in-button>
      </template>
      <template #policyConfig="{ item }">
        <PolicyDisplayView
          :policyType="item.policyType || ''"
          :policyConfig="item.policyConfig || {}"
        />
      </template>
      <template #priority="{ item }">
        <el-tag>
          {{ item.priority }}
        </el-tag>
      </template>
      <template #enabled="{ item }">
        <el-tag :type="item.enabled ? 'success' : 'danger'">
          {{ item.enabled ? "是" : "否" }}
        </el-tag>
      </template>
      <template #actions="{ item }">
        <in-button-edit @click="handleEdit(item)" />
        <in-button-delete @click="handleRemoveClick(item)" />
      </template>
    </in-table>

    <EditDrawer ref="EditDrawerRef" @success="refreshData" />
  </in-filter-container>
</template>
<script lang="ts" setup>
import { tableHeaders } from "./table";
import type { CredentialPolicyConfig } from "@/models";
import { useCredentialPolicyTypeEnum } from "@/models/enums";
import { GetPolicyConfigList, DeletePolicyConfig } from "@/api/platform/security/credential";
import PolicyDisplayView from "./PolicyDisplayView.vue";
import EditDrawer from "./EditDrawer.vue";

const EditDrawerRef = ref();

const data = ref<Array<CredentialPolicyConfig>>([]);

const loading = ref(false);
const credentialPolicyTypeEnum = useCredentialPolicyTypeEnum();
const confirmDelete = useConfirmDelete(transformDeleteAPI(DeletePolicyConfig), () => {
  refreshData();
});
const refreshData = () => {
  loading.value = true;
  GetPolicyConfigList()
    .then((response) => {
      loading.value = false;
      data.value = response.data;
    })
    .catch(() => {
      loading.value = false;
    });
};

const handleCreate = (): void => {
  EditDrawerRef.value.show();
};

const handleEdit = (params: CredentialPolicyConfig): void => {
  EditDrawerRef.value.show(params);
};

const handleRemoveClick = (params: CredentialPolicyConfig) => {
  confirmDelete.exec(params.id!, `是否删除该策略`, "删除成功");
};

onMounted(() => {
  refreshData();
});
</script>
