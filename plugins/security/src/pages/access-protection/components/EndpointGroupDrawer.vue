<template>
  <in-drawer :title="title" v-model="visible">
    <in-form ref="editFormRef" :model="editForm" :rules="rules">
      <el-form-item label="编码" prop="code">
        <el-input
          v-model="editForm.code"
          :disabled="edit"
          clearable
          placeholder="英文、数字、连字符"
        />
      </el-form-item>
      <el-form-item label="名称" prop="name">
        <el-input v-model="editForm.name" clearable placeholder="请输入展示名称" />
      </el-form-item>
      <el-form-item label="路径规则" prop="patternList">
        <PatternListEditor v-model="editForm.patternList" prop-prefix="patternList" />
      </el-form-item>
      <el-form-item label="是否启用">
        <el-switch v-model="editForm.enabled" inline-prompt active-text="是" inactive-text="否" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input
          v-model="editForm.remark"
          type="textarea"
          :rows="3"
          clearable
          placeholder="请输入备注"
        />
      </el-form-item>
    </in-form>
    <template #footer>
      <in-button v-if="edit" type="danger" @click="privateOnRemoveClick"> 删除 </in-button>
      <in-button :loading="loading" type="primary" @click="privateOnConfirmClick"> 确定 </in-button>
    </template>
  </in-drawer>
</template>

<script setup lang="ts">
import type { GatewayEndpointGroup, GatewayEndpointPattern } from "@/models";
import { HttpMethodEnum } from "@/models/enums";
import { Confirm, copyParams } from "@ingot/admin-core";
import {
  CreateEndpointGroupAPI,
  DeleteEndpointGroupAPI,
  UpdateEndpointGroupAPI,
} from "@/api/security/policy";
import PatternListEditor from "./PatternListEditor.vue";

const CODE_PATTERN = /^[a-zA-Z0-9-]+$/;
const POLICY_EFFECT_MESSAGE = "规则将在数秒内生效";

type EndpointGroupForm = GatewayEndpointGroup & {
  patternList: Array<GatewayEndpointPattern>;
};

const defaultEditForm: EndpointGroupForm = {
  id: undefined,
  code: undefined,
  name: undefined,
  patternList: [{ path: "", method: HttpMethodEnum.POST }],
  enabled: true,
  remark: undefined,
};

const emits = defineEmits<{ success: [] }>();

const editFormRef = ref();
const editForm = reactive<EndpointGroupForm>(Object.assign({}, defaultEditForm));
const loading = ref(false);
const title = ref("");
const edit = ref(false);
const visible = ref(false);

const message = useMessage();
const privateOnRemoveClick = (): void => {
  if (!editForm.id) {
    return;
  }
  Confirm.warning(`是否删除分组(${editForm.code})`).then(() => {
    DeleteEndpointGroupAPI(editForm.id!).then(() => {
      message.success("删除成功");
      visible.value = false;
      emits("success");
    });
  });
};

const rules = {
  code: [
    { required: true, message: "请输入编码", trigger: "blur" },
    {
      pattern: CODE_PATTERN,
      message: "编码仅支持英文、数字和连字符",
      trigger: "blur",
    },
  ],
  name: [{ required: true, message: "请输入名称", trigger: "blur" }],
  patternList: [{ required: true, message: "请至少添加一条路径规则", trigger: "change" }],
};

const privateOnConfirmClick = (): void => {
  const form = unref(editFormRef);
  form.validate((valid: boolean) => {
    if (!valid) {
      return;
    }

    loading.value = true;
    const request = edit.value
      ? UpdateEndpointGroupAPI(Object.assign({}, toRaw(editForm)))
      : CreateEndpointGroupAPI(Object.assign({}, toRaw(editForm)));

    request
      .then(() => {
        message.success(POLICY_EFFECT_MESSAGE);
        visible.value = false;
        emits("success");
      })
      .finally(() => {
        loading.value = false;
      });
  });
};

defineExpose({
  show(data?: GatewayEndpointGroup) {
    visible.value = true;
    copyParams(editForm, defaultEditForm);
    editForm.patternList = [{ path: "", method: HttpMethodEnum.POST }];
    nextTick(() => {
      unref(editFormRef)?.clearValidate();
    });

    if (data) {
      title.value = "编辑路径分组";
      edit.value = true;
      copyParams(editForm, data);
      editForm.patternList = data.patternList?.length
        ? data.patternList.map((item) => ({ ...item }))
        : [{ path: "", method: HttpMethodEnum.POST }];
      return;
    }

    title.value = "新建路径分组";
    edit.value = false;
  },
});
</script>
