<template>
  <in-drawer v-model="visible" title="创建套餐" :loading="loading" size="560px">
    <el-form label-position="top">
      <el-form-item label="名称" required>
        <el-input v-model="draft.name" />
      </el-form-item>
      <el-form-item label="说明">
        <el-input v-model="draft.description" type="textarea" :rows="3" />
      </el-form-item>
      <el-form-item label="包含应用">
        <el-select v-model="draft.applicationIds" multiple filterable>
          <el-option
            v-for="item in applications"
            :key="item.record.id"
            :label="item.record.name"
            :value="item.record.id"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <in-button @click="visible = false">取消</in-button>
      <in-button type="primary" :loading="loading" @in-click="privateSubmit">创建</in-button>
    </template>
  </in-drawer>
</template>

<script setup lang="ts">
import { Message } from "@ingot/admin-core";
import type { ApplicationRecord, ResourceDetail } from "@ingot/admin-common";
import { PlatformApplicationPageAPI, PlatformPlanCreateAPI } from "@/api/iam/catalog";
import { platformPlanQueryKeys } from "@/api/iam/catalog.query";
import { useQueryClient } from "@tanstack/vue-query";

defineOptions({ name: "PlanCreateDrawer" });

const emits = defineEmits<{ success: [] }>();
const queryClient = useQueryClient();
const visible = ref(false);
const loading = ref(false);
const applications = ref<Array<ResourceDetail<ApplicationRecord>>>([]);
const draft = reactive({
  name: "",
  description: "",
  applicationIds: [] as string[],
});

const privateSubmit = (): void => {
  if (!draft.name.trim()) {
    Message.warning("请输入套餐名称");
    return;
  }
  loading.value = true;
  PlatformPlanCreateAPI({
    name: draft.name.trim(),
    description: draft.description.trim() || undefined,
    applicationIds: [...draft.applicationIds],
  })
    .then(() => {
      Message.success("创建成功，修改套餐不会自动改变既有租户开通");
      void queryClient.invalidateQueries({ queryKey: platformPlanQueryKeys.lists() });
      visible.value = false;
      emits("success");
    })
    .finally(() => {
      loading.value = false;
    });
};

defineExpose({
  show() {
    draft.name = "";
    draft.description = "";
    draft.applicationIds = [];
    visible.value = true;
    PlatformApplicationPageAPI({ current: 1, size: 200 }).then((response) => {
      applications.value = response.data.records ?? [];
    });
  },
});
</script>
