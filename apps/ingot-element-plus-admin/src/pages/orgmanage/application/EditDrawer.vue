<template>
  <in-drawer :title="title" v-model="visible" @close="loading = false" width="40%">
    <in-form ref="editFormRef" class="form" :model="editForm" :rules="rules">
      <el-form-item label="菜单" prop="menuId">
        <el-tree-select
          w-full
          v-model="editForm.menuId"
          :data="menuData"
          :node-key="TreeKeyAndProps.nodeKey"
          :value-key="TreeKeyAndProps.nodeKey"
          :props="TreeKeyAndProps.props"
          :check-strictly="true"
        />
      </el-form-item>
      <el-form-item label="默认应用">
        <el-switch v-model="editForm.defaultApp" />
      </el-form-item>
    </in-form>
    <template #footer>
      <in-button :loading="loading" type="primary" @click="handleConfirmClick"> 确定 </in-button>
    </template>
  </in-drawer>
</template>
<script lang="ts" setup>
import type { SysApplication } from "@/models";
import { TreeKeyAndProps } from "@/models";
import { Message } from "@/utils/message";
import { copyParams, copyParamsWithKeys } from "@/utils/object";
import { CreateAppAPI } from "@/api/basic/application";

const rules = {
  menuId: [{ required: true, message: "请选择菜单", trigger: "blur" }],
};

const defaultEditForm: SysApplication = {
  id: undefined,
  menuId: undefined,
  authorityId: undefined,
  defaultApp: undefined,
};

const keys = Object.keys(defaultEditForm);

const emits = defineEmits(["success"]);
defineProps({
  menuData: {
    type: Array,
  },
  authorityData: {
    type: Array,
  },
});

const editFormRef = ref();
const editForm = reactive(Object.assign({}, defaultEditForm));
const rawEditForm = reactive(Object.assign({}, defaultEditForm));
const loading = ref(false);
const title = ref("添加应用");
const visible = ref(false);

const handleConfirmClick = () => {
  const form = unref(editFormRef);
  form.validate((valid: boolean) => {
    if (valid) {
      loading.value = true;
      let params: SysApplication = {};
      copyParamsWithKeys(params, toRaw(editForm), keys);
      CreateAppAPI(params)
        .then(() => {
          loading.value = false;
          Message.success("操作成功");
          visible.value = false;
          emits("success");
        })
        .catch(() => {
          loading.value = false;
        });
    }
  });
};

defineExpose({
  show() {
    visible.value = true;

    // 重置数据
    copyParams(editForm, defaultEditForm);
    copyParams(rawEditForm, defaultEditForm);
    nextTick(() => {
      const form = unref(editFormRef);
      form.clearValidate();
    });
  },
});
</script>
