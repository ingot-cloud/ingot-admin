<template>
  <in-drawer :title="title" v-model="visible">
    <in-form ref="editFormRef" :model="editForm" :rules="rules">
      <el-form-item label="名单类型" prop="listType">
        <in-select
          v-model="editForm.listType"
          :options="ipListTypeEnum.getOptions()"
          placeholder="请选择名单类型"
        />
      </el-form-item>
      <el-form-item label="Key 类型" prop="keyType">
        <in-select
          v-model="editForm.keyType"
          :options="ipListKeyTypeEnum.getOptions()"
          placeholder="请选择 Key 类型"
        />
      </el-form-item>
      <el-form-item label="匹配值" prop="keyValue">
        <el-input v-model="editForm.keyValue" clearable placeholder="请输入匹配值" />
      </el-form-item>
      <el-form-item label="原因">
        <el-input v-model="editForm.reason" clearable placeholder="请输入原因" />
      </el-form-item>
      <el-form-item label="生效时间">
        <el-date-picker
          v-model="editForm.effectiveAt"
          type="datetime"
          value-format="YYYY-MM-DDTHH:mm:ss"
          clearable
          placeholder="留空表示立即生效"
          class="w-full"
        />
      </el-form-item>
      <el-form-item label="失效时间">
        <el-date-picker
          v-model="editForm.expiresAt"
          type="datetime"
          value-format="YYYY-MM-DDTHH:mm:ss"
          clearable
          placeholder="留空表示永久有效"
          class="w-full"
        />
      </el-form-item>
      <el-form-item label="是否启用">
        <el-switch v-model="editForm.enabled" inline-prompt active-text="是" inactive-text="否" />
      </el-form-item>
    </in-form>
    <template #footer>
      <in-button v-if="edit" type="danger" @click="privateOnRemoveClick"> 删除 </in-button>
      <in-button :loading="loading" type="primary" @click="privateOnConfirmClick"> 确定 </in-button>
    </template>
  </in-drawer>
</template>

<script setup lang="ts">
import type { GatewayIpList } from "@/models";
import {
  IpListKeyTypeEnum,
  IpListTypeEnum,
  useIpListKeyTypeEnum,
  useIpListTypeEnum,
} from "@/models/enums";
import { Confirm, copyParams } from "@ingot/admin-core";
import {
  CreateIpListAPI,
  DeleteIpListAPI,
  UpdateIpListAPI,
} from "@/api/security/policy";

const POLICY_EFFECT_MESSAGE = "规则将在数秒内生效";

const defaultEditForm: GatewayIpList = {
  id: undefined,
  listType: IpListTypeEnum.BLACK,
  keyType: IpListKeyTypeEnum.IP,
  keyValue: undefined,
  reason: undefined,
  source: undefined,
  effectiveAt: undefined,
  expiresAt: undefined,
  enabled: true,
};

const emits = defineEmits<{ success: [] }>();

const ipListTypeEnum = useIpListTypeEnum();
const ipListKeyTypeEnum = useIpListKeyTypeEnum();

const editFormRef = ref();
const editForm = reactive<GatewayIpList>(Object.assign({}, defaultEditForm));
const loading = ref(false);
const title = ref("");
const edit = ref(false);
const visible = ref(false);

const message = useMessage();

const privateOnRemoveClick = (): void => {
  if (!editForm.id) {
    return;
  }
  Confirm.warning(`是否删除名单(${editForm.keyValue})`).then(() => {
    DeleteIpListAPI(editForm.id!).then(() => {
      message.success("删除成功");
      visible.value = false;
      emits("success");
    });
  });
};

const rules = {
  listType: [{ required: true, message: "请选择名单类型", trigger: "change" }],
  keyType: [{ required: true, message: "请选择 Key 类型", trigger: "change" }],
  keyValue: [{ required: true, message: "请输入匹配值", trigger: "blur" }],
};

const privateOnConfirmClick = (): void => {
  const form = unref(editFormRef);
  form.validate((valid: boolean) => {
    if (!valid) {
      return;
    }

    loading.value = true;
    const request = edit.value
      ? UpdateIpListAPI(Object.assign({}, toRaw(editForm)))
      : CreateIpListAPI(Object.assign({}, toRaw(editForm)));

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
  show(data?: GatewayIpList) {
    visible.value = true;
    copyParams(editForm, defaultEditForm);
    nextTick(() => {
      unref(editFormRef)?.clearValidate();
    });

    if (data) {
      title.value = "编辑黑白名单";
      edit.value = true;
      copyParams(editForm, data);
      return;
    }

    title.value = "新建黑白名单";
    edit.value = false;
  },
});
</script>
