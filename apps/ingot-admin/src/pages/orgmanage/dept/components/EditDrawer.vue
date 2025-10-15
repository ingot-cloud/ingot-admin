<template>
  <in-drawer :title="title" v-model="visible">
    <in-form ref="editFormRef" label-width="80px" :model="editForm" :rules="rules">
      <el-form-item prop="pid" label="上级部门">
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

      <el-form-item prop="name" label="部门名称">
        <el-input v-model="editForm.name" placeholder="请输入部门名称" clearable></el-input>
      </el-form-item>

      <el-form-item prop="status" label="状态" v-if="edit">
        <el-radio-group v-model="editForm.status">
          <el-radio-button :value="CommonStatus.Enable">
            {{ statusEnum.getTagText(CommonStatus.Enable).text }}
          </el-radio-button>
          <el-radio-button :value="CommonStatus.Lock">
            {{ statusEnum.getTagText(CommonStatus.Lock).text }}
          </el-radio-button>
        </el-radio-group>
      </el-form-item>
    </in-form>
    <template #footer>
      <in-button :loading="loading" type="primary" @click="handleConfirmClick"> 确定 </in-button>
    </template>
  </in-drawer>
</template>
<script setup lang="ts">
import { CommonStatus, CommonStatusEnumExtArray } from "@/models/enums";
import { TreeKeyAndProps } from "@/models";
import type { SysDept } from "@/models";
import { CreateDeptAPI, UpdateDeptAPI } from "@/api/basic/dept";
import { Message } from "@/utils/message";
import { copyParams, getDiff } from "@/utils/object";

const defaultEditForm: SysDept = {
  id: undefined,
  pid: undefined,
  name: undefined,
  sort: 999,
  status: CommonStatus.Enable,
};

const rules = {
  pid: [{ required: true, message: "请选择上级菜单", trigger: "blur" }],
  name: [{ required: true, message: "请输入部门名称", trigger: "blur" }],
};

const emits = defineEmits(["success"]);
defineProps({
  selectData: {
    type: Array,
  },
});

const edit = ref(false);
const canEditPid = ref(false);
const visible = ref(false);
const loading = ref(false);

const statusEnum = useEnum(CommonStatusEnumExtArray);
const editFormRef = ref();

const title = ref("");
const editForm = reactive(Object.assign({}, defaultEditForm));
const rawForm: SysDept = {};

const handleConfirmClick = () => {
  const form = unref(editFormRef);
  form.validate((valid: boolean) => {
    if (valid) {
      let request;
      if (edit.value) {
        const params = getDiff<SysDept>(rawForm, editForm);
        params.id = rawForm.id;
        request = UpdateDeptAPI(params);
      } else {
        const params = Object.assign({}, toRaw(editForm));
        request = CreateDeptAPI(params);
      }

      loading.value = true;
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

const show = (data: SysDept | string) => {
  visible.value = true;

  // 重置数据
  copyParams(editForm, defaultEditForm);
  copyParams(rawForm, defaultEditForm);
  nextTick(() => {
    const form = unref(editFormRef);
    form.clearValidate();
  });

  if (typeof data === "string") {
    title.value = "添加部门";
    edit.value = false;
    canEditPid.value = false;
    editForm.pid = data;
  } else {
    copyParams(editForm, data);
    copyParams(rawForm, data);
    title.value = data.name!;
    edit.value = true;
    canEditPid.value = true;
  }
};

defineExpose({
  show,
});
</script>
