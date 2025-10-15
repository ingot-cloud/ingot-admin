<template>
  <in-drawer :title="title" v-model="visible" @close="loading = false" width="40%">
    <in-form ref="editFormRef" class="form" :model="editForm" :rules="rules">
      <el-form-item label="上级权限">
        <el-tree-select
          w-full
          v-model="editForm.pid"
          :data="selectData"
          :disabled="!canEditPid"
          :node-key="TreeKeyAndProps.nodeKey"
          :value-key="TreeKeyAndProps.nodeKey"
          :props="TreeKeyAndProps.props"
          :check-strictly="true"
        />
      </el-form-item>
      <el-form-item label="权限名称" prop="name">
        <el-input
          v-model="editForm.name"
          clearable
          placeholder="请输入权限名称"
          class="form-item"
        ></el-input>
      </el-form-item>
      <el-form-item label="权限编码" prop="code">
        <el-input
          :disabled="edit"
          v-model="editForm.code"
          clearable
          placeholder="请输入权限编码"
          class="form-item"
        ></el-input>
      </el-form-item>
      <el-form-item label="权限类型" prop="type">
        <in-select
          w-full
          v-model="editForm.type"
          placeholder="请选择权限类型"
          :options="authorityTypeEnum.getOptions()"
          clearable
        />
      </el-form-item>
      <el-form-item label="备注">
        <el-input
          v-model="editForm.remark"
          clearable
          placeholder="请输入备注信息"
          class="form-item"
        ></el-input>
      </el-form-item>
    </in-form>
    <template #footer>
      <in-button v-if="edit" type="danger" @click="handleRemoveClick"> 删除 </in-button>
      <in-button :loading="loading" type="primary" @click="handleConfirmClick"> 确定 </in-button>
    </template>
  </in-drawer>
</template>
<script lang="ts">
import type { SysAuthority as P } from "@/models";
export interface API {
  show(data?: P | string): void;
}
</script>
<script lang="ts" setup>
import type { SysAuthority } from "@/models";
import { TreeKeyAndProps } from "@/models";
import { useAuthorityStore } from "@/stores/modules/authority";
import { useOrgTypeEnums } from "@/models/enums";
import { Message } from "@/utils/message";
import { copyParams, copyParamsWithKeys, getDiffWithIgnore } from "@/utils/object";

const rules = {
  name: [{ required: true, message: "请输入权限名称", trigger: "blur" }],
  code: [{ required: true, message: "请输入权限编码", trigger: "blur" }],
  type: [{ required: true, message: "请选择权限类型", trigger: "blur" }],
};

const defaultEditForm: SysAuthority = {
  id: undefined,
  pid: undefined,
  name: undefined,
  code: undefined,
  type: undefined,
  remark: undefined,
};

const keys = Object.keys(defaultEditForm);

const emits = defineEmits(["success"]);
defineProps({
  selectData: {
    type: Array,
  },
});

const editFormRef = ref();
const editForm = reactive(Object.assign({}, defaultEditForm));
const rawEditForm = reactive(Object.assign({}, defaultEditForm));
const loading = ref(false);
const title = ref("");
const edit = ref(false);
const canEditPid = ref(false);
const visible = ref(false);

const authorityStore = useAuthorityStore();
const authorityTypeEnum = useOrgTypeEnums();
const confirmDelete = useConfirmDelete(authorityStore.removeAuthority, () => {
  visible.value = false;
  emits("success");
});

const handleRemoveClick = () => {
  confirmDelete.exec(editForm.id!, `是否删除权限(${editForm.name})`, "删除成功");
};

const handleConfirmClick = () => {
  const form = unref(editFormRef);
  form.validate((valid: boolean) => {
    if (valid) {
      loading.value = true;
      let params: SysAuthority = {};
      let request;
      if (edit.value) {
        params = getDiffWithIgnore(rawEditForm, editForm);
        if (Object.keys(params).length === 0) {
          Message.warning("未改变数据");
          return;
        }
        params.id = rawEditForm.id;
        request = authorityStore.updateAuthority(params);
      } else {
        copyParamsWithKeys(params, toRaw(editForm), keys);
        request = authorityStore.createAuthority(params);
      }
      request
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
  show(data?: SysAuthority | string) {
    visible.value = true;

    // 重置数据
    copyParams(editForm, defaultEditForm);
    copyParams(rawEditForm, defaultEditForm);
    nextTick(() => {
      const form = unref(editFormRef);
      form.clearValidate();
    });

    if (data) {
      if (typeof data === "string") {
        title.value = "添加权限";
        edit.value = false;
        canEditPid.value = false;
        editForm.pid = data;
      } else {
        copyParams(editForm, data);
        copyParams(rawEditForm, data);
        title.value = "编辑权限";
        edit.value = true;
        canEditPid.value = false;
      }
    } else {
      title.value = "添加权限";
      edit.value = false;
      canEditPid.value = true;
    }
  },
});
</script>
