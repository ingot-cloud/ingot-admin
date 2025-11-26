<template>
  <div>
    <in-form-group-title title="基本信息" v-model="editFlag" />
    <div p-20px>
      <in-form ref="FormRef" :model="editForm" :rules="rules" :disabled="!editFlag">
        <el-form-item label="logo">
          <in-common-upload-avatar dir="tenant" v-model="editForm.avatar" />
        </el-form-item>
        <el-form-item label="组织类型" prop="orgType">
          <in-select
            w-full
            disabled
            v-model="editForm.orgType"
            placeholder="请选择类型"
            :options="orgTypeEnums.getOptions()"
            clearable
          />
        </el-form-item>
        <el-form-item label="组织名称" prop="name">
          <el-input v-model="editForm.name" clearable placeholder="请输入组织名称"></el-input>
        </el-form-item>
        <el-form-item label="组织编码" prop="code">
          <el-input
            disabled
            v-model="editForm.code"
            clearable
            placeholder="请输入组织编码"
          ></el-input>
        </el-form-item>
      </in-form>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { SysTenant } from "@/models";
import { copyParams } from "@/utils/object";
import { useOrgTypeEnums } from "@/models/enums";

const defaultEditForm: SysTenant = {
  id: undefined,
  name: undefined,
  code: undefined,
  orgType: undefined,
  planId: undefined,
  status: undefined,
  endAt: undefined,
  avatar: undefined,
};

const rules = {
  name: [{ required: true, message: "请输入组织名称", trigger: "blur" }],
  code: [{ required: true, message: "请输入组织编码", trigger: "blur" }],
  orgType: [{ required: true, message: "请选择组织类型", trigger: "blur" }],
};

const orgTypeEnums = useOrgTypeEnums();
const editFlag = ref(false);
const FormRef = ref();
const editForm = reactive(Object.assign({}, defaultEditForm));

defineExpose({
  setData(data: SysTenant) {
    editFlag.value = false;
    // 重置数据
    copyParams(editForm, defaultEditForm);
    nextTick(() => {
      const form = unref(FormRef);
      form.clearValidate();
    });

    copyParams(editForm, data);
  },
  getData() {
    return new Promise<SysTenant>((resolve, reject) => {
      if (!editFlag.value) {
        reject();
        return;
      }

      const params: SysTenant = {};
      copyParams(params, toRaw(editForm));

      FormRef.value.validate((valid: boolean) => {
        if (valid) {
          editFlag.value = false;
          resolve(params);
        }
      });
    });
  },
});
</script>
<style scoped lang="postcss"></style>
